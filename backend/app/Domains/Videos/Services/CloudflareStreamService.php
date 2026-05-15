<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Central service for Cloudflare Stream API operations.
 *
 * Handles:
 *  - Direct Creator Upload via TUS protocol
 *  - Signed URL / token generation for secure playback
 *  - Video management (details, delete, allowed origins)
 *  - Analytics via GraphQL API
 *  - Webhook signature verification
 */
class CloudflareStreamService
{
    private string $accountId;
    private string $apiToken;
    private string $signingKey;
    private string $keyId;
    private string $webhookSecret;
    private string $customerSubdomain;
    private string $baseUrl;

    public function __construct()
    {
        $this->accountId         = (string) config('cloudflare.stream.account_id');
        $this->apiToken          = (string) config('cloudflare.stream.api_token');
        $this->signingKey        = (string) config('cloudflare.stream.signing_key');
        $this->keyId             = (string) config('cloudflare.stream.key_id');
        $this->webhookSecret     = (string) config('cloudflare.stream.webhook_secret');
        $this->customerSubdomain = (string) config('cloudflare.stream.customer_subdomain');
        $this->baseUrl           = "https://api.cloudflare.com/client/v4/accounts/{$this->accountId}/stream";
    }

    // ─────────────────────────────────────────────────────────────────
    // Upload (TUS Direct Creator Upload)
    // ─────────────────────────────────────────────────────────────────

    /**
     * Request a one-time TUS upload URL from Cloudflare Stream.
     *
     * The frontend will use tus-js-client to upload directly to this URL.
     * The server never touches video bytes.
     *
     * @param  int                    $maxDurationSeconds  Maximum expected video duration
     * @param  array<string, string>  $meta                Video metadata (name, etc.)
     * @return array{upload_url: string, stream_uid: string}
     *
     * @throws \RuntimeException
     */
    public function createDirectUploadUrl(int $maxDurationSeconds, array $meta = []): array
    {
        $requireSignedUrls = (bool) config('cloudflare.stream.require_signed_urls', true);
        $allowedOrigins    = (array) config('cloudflare.stream.allowed_origins', []);

        $body = [
            'maxDurationSeconds'  => min($maxDurationSeconds, (int) config('cloudflare.stream.max_duration_seconds', 7200)),
            'requireSignedURLs'   => $requireSignedUrls,
        ];

        if (! empty($allowedOrigins)) {
            $body['allowedOrigins'] = $allowedOrigins;
        }

        if (! empty($meta)) {
            $body['meta'] = $meta;
        }

        $response = $this->client()
            ->withHeaders([
                'Tus-Resumable' => '1.0.0',
            ])
            ->post("{$this->baseUrl}/direct_upload", $body);

        if (! $response->successful()) {
            $errorData = $response->json();
            $errorMessage = $errorData['errors'][0]['message'] ?? 'فشل إنشاء رابط الرفع من Cloudflare Stream.';
            
            Log::error('Cloudflare Stream: createDirectUploadUrl failed', [
                'status' => $response->status(),
                'errors' => $errorData['errors'] ?? [],
                'body'   => $response->body(),
            ]);

            throw new \RuntimeException($errorMessage);
        }

        $result = $response->json('result', []);

        return [
            'upload_url' => $result['uploadURL'] ?? '',
            'stream_uid' => $result['uid'] ?? '',
        ];
    }

    // ─────────────────────────────────────────────────────────────────
    // Signed URLs / Tokens
    // ─────────────────────────────────────────────────────────────────

    /**
     * Generate a signed token for secure video playback.
     *
     * Uses RS256 JWT signed with the Stream signing key.
     *
     * @param  string      $videoUid     Stream video UID
     * @param  int         $ttlSeconds   Token validity duration
     * @param  array|null  $accessRules  Optional access restrictions (geo, IP, etc.)
     */
    public function generateSignedToken(string $videoUid, ?int $ttlSeconds = null, ?array $accessRules = null): string
    {
        $ttl = $ttlSeconds ?? (int) config('cloudflare.stream.signed_token_ttl', 3600);

        $header = [
            'alg' => 'RS256',
            'kid' => $this->keyId,
        ];

        $payload = [
            'sub' => $videoUid,
            'kid' => $this->keyId,
            'exp' => time() + $ttl,
            'nbf' => time() - 60, // 1-minute clock skew tolerance
        ];

        if ($accessRules) {
            $payload['accessRules'] = $accessRules;
        }

        $headerEncoded  = $this->base64UrlEncode(json_encode($header, JSON_THROW_ON_ERROR));
        $payloadEncoded = $this->base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR));

        $signingInput = "{$headerEncoded}.{$payloadEncoded}";

        $privateKey = openssl_pkey_get_private($this->signingKey);
        if ($privateKey === false) {
            throw new \RuntimeException('Invalid Cloudflare Stream signing key.');
        }

        $signature = '';
        if (! openssl_sign($signingInput, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
            throw new \RuntimeException('Failed to sign Cloudflare Stream token.');
        }

        return "{$signingInput}." . $this->base64UrlEncode($signature);
    }

    /**
     * Get a signed HLS playback URL for a video.
     */
    public function getSignedPlaybackUrl(string $videoUid, ?int $ttlSeconds = null): string
    {
        $token = $this->generateSignedToken($videoUid, $ttlSeconds);
        $subdomain = $this->customerSubdomain;

        if ($subdomain) {
            return "https://customer-{$subdomain}.cloudflarestream.com/{$token}/manifest/video.m3u8";
        }

        return "https://videodelivery.net/{$token}/manifest/video.m3u8";
    }

    /**
     * Get a signed iframe embed URL for a video.
     */
    public function getSignedIframeUrl(string $videoUid, ?int $ttlSeconds = null): string
    {
        $token = $this->generateSignedToken($videoUid, $ttlSeconds);
        $subdomain = $this->customerSubdomain;

        if ($subdomain) {
            return "https://customer-{$subdomain}.cloudflarestream.com/{$token}/iframe";
        }

        return "https://iframe.videodelivery.net/{$token}";
    }

    // ─────────────────────────────────────────────────────────────────
    // Video Management
    // ─────────────────────────────────────────────────────────────────

    /**
     * Get video details from Cloudflare Stream.
     *
     * @return array<string, mixed>  Video details including duration, status, thumbnail, etc.
     */
    public function getVideoDetails(string $videoUid): array
    {
        $response = $this->client()->get("{$this->baseUrl}/{$videoUid}");

        if (! $response->successful()) {
            Log::warning('Cloudflare Stream: getVideoDetails failed', [
                'uid'    => $videoUid,
                'status' => $response->status(),
            ]);
            return [];
        }

        return $response->json('result', []);
    }

    /**
     * Delete a video from Cloudflare Stream.
     */
    public function deleteVideo(string $videoUid): bool
    {
        $response = $this->client()->delete("{$this->baseUrl}/{$videoUid}");

        if (! $response->successful()) {
            Log::warning('Cloudflare Stream: deleteVideo failed', [
                'uid'    => $videoUid,
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return false;
        }

        return true;
    }

    /**
     * Set allowed origins (domains) for a video.
     *
     * @param  array<int, string>  $domains
     */
    public function setAllowedOrigins(string $videoUid, array $domains): bool
    {
        $response = $this->client()->post("{$this->baseUrl}/{$videoUid}", [
            'allowedOrigins' => $domains,
        ]);

        return $response->successful();
    }

    /**
     * Enable or disable signed URL requirement for a video.
     */
    public function requireSignedUrls(string $videoUid, bool $require = true): bool
    {
        $response = $this->client()->post("{$this->baseUrl}/{$videoUid}", [
            'requireSignedURLs' => $require,
        ]);

        return $response->successful();
    }

    // ─────────────────────────────────────────────────────────────────
    // Thumbnails
    // ─────────────────────────────────────────────────────────────────

    /**
     * Get a thumbnail URL for a video.
     *
     * @param  string   $videoUid     Stream video UID
     * @param  int|null $timeSeconds  Timestamp in seconds for the thumbnail frame
     * @param  int      $width        Thumbnail width
     * @param  int      $height       Thumbnail height
     */
    public function getThumbnailUrl(
        string $videoUid,
        ?int $timeSeconds = null,
        int $width = 640,
        int $height = 360,
    ): string {
        $base = "https://videodelivery.net/{$videoUid}/thumbnails/thumbnail.jpg";

        $params = [
            'width'  => $width,
            'height' => $height,
        ];

        if ($timeSeconds !== null) {
            $params['time'] = "{$timeSeconds}s";
        }

        return $base . '?' . http_build_query($params);
    }

    // ─────────────────────────────────────────────────────────────────
    // Analytics (GraphQL API)
    // ─────────────────────────────────────────────────────────────────

    /**
     * Get video analytics (minutes viewed) via GraphQL.
     *
     * @return array{minutes_viewed: float, views: int}
     */
    public function getVideoAnalytics(string $videoUid, string $since, string $until): array
    {
        $query = <<<'GRAPHQL'
        {
          viewer {
            accounts(filter: { accountTag: "%s" }) {
              streamMinutesViewedAdaptiveGroups(
                filter: { uid: "%s", date_geq: "%s", date_leq: "%s" }
                limit: 1000
              ) {
                sum { minutesViewed }
                count
              }
            }
          }
        }
        GRAPHQL;

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->apiToken}",
            'Content-Type'  => 'application/json',
        ])->post('https://api.cloudflare.com/client/v4/graphql', [
            'query' => sprintf($query, $this->accountId, $videoUid, $since, $until),
        ]);

        if (! $response->successful()) {
            Log::warning('Cloudflare Stream Analytics: query failed', [
                'uid'    => $videoUid,
                'status' => $response->status(),
            ]);
            return ['minutes_viewed' => 0.0, 'views' => 0];
        }

        $groups = data_get(
            $response->json(),
            'data.viewer.accounts.0.streamMinutesViewedAdaptiveGroups',
            []
        );

        $totalMinutes = 0.0;
        $totalViews   = 0;

        foreach ($groups as $group) {
            $totalMinutes += (float) ($group['sum']['minutesViewed'] ?? 0);
            $totalViews   += (int) ($group['count'] ?? 0);
        }

        return [
            'minutes_viewed' => round($totalMinutes, 2),
            'views'          => $totalViews,
        ];
    }

    /**
     * Get total account-level delivery usage (for billing reconciliation).
     *
     * @return array{total_minutes_delivered: float}
     */
    public function getAccountDeliveryUsage(string $since, string $until): array
    {
        $query = <<<'GRAPHQL'
        {
          viewer {
            accounts(filter: { accountTag: "%s" }) {
              streamMinutesViewedAdaptiveGroups(
                filter: { date_geq: "%s", date_leq: "%s" }
                limit: 10000
              ) {
                sum { minutesViewed }
                dimensions { uid }
              }
            }
          }
        }
        GRAPHQL;

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->apiToken}",
            'Content-Type'  => 'application/json',
        ])->post('https://api.cloudflare.com/client/v4/graphql', [
            'query' => sprintf($query, $this->accountId, $since, $until),
        ]);

        if (! $response->successful()) {
            return ['total_minutes_delivered' => 0.0];
        }

        $groups = data_get(
            $response->json(),
            'data.viewer.accounts.0.streamMinutesViewedAdaptiveGroups',
            []
        );

        $total = 0.0;
        foreach ($groups as $group) {
            $total += (float) ($group['sum']['minutesViewed'] ?? 0);
        }

        return ['total_minutes_delivered' => round($total, 2)];
    }

    // ─────────────────────────────────────────────────────────────────
    // Webhooks
    // ─────────────────────────────────────────────────────────────────

    /**
     * Verify that a webhook request actually came from Cloudflare.
     *
     * Cloudflare signs webhook payloads using the webhook secret.
     *
     * @param  string  $payload    Raw request body
     * @param  string  $signature  Value of the Webhook-Signature header
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        if (empty($this->webhookSecret) || empty($signature)) {
            return false;
        }

        // Cloudflare sends: time=<timestamp>,sig1=<hex_signature>
        $parts = [];
        foreach (explode(',', $signature) as $part) {
            [$key, $value] = explode('=', $part, 2) + [1 => ''];
            $parts[trim($key)] = trim($value);
        }

        $timestamp = $parts['time'] ?? '';
        $sig1      = $parts['sig1'] ?? '';

        if (empty($timestamp) || empty($sig1)) {
            return false;
        }

        // Verify timestamp is within 5 minutes
        if (abs(time() - (int) $timestamp) > 300) {
            return false;
        }

        $expected = hash_hmac('sha256', "{$timestamp}.{$payload}", $this->webhookSecret);

        return hash_equals($expected, $sig1);
    }

    // ─────────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────────

    private function client(): PendingRequest
    {
        return Http::withHeaders([
            'Authorization' => "Bearer {$this->apiToken}",
        ])->acceptJson()->timeout(30);
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
