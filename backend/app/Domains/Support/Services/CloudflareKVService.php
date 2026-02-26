<?php

declare(strict_types=1);

namespace App\Domains\Support\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class CloudflareKVService
{
    private Client $client;
    private string $accountId;
    private string $namespaceId;
    private string $apiToken;

    public function __construct()
    {
        $this->client      = new Client();
        $this->accountId   = config('services.cloudflare.kv.account_id');
        $this->namespaceId = config('services.cloudflare.kv.namespace_id');
        $this->apiToken    = config('services.cloudflare.kv.api_token');
    }

    public function set(string $key, $value): bool
    {
        try {
            $url = $this->buildUrl($key);

            $response = $this->client->put($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiToken,
                    'Content-Type'  => 'application/json',
                ],
                'body' => json_encode($value),
            ]);

            return $response->getStatusCode() === 200;
        } catch (GuzzleException $e) {
            \Log::error('Cloudflare KV Set Error: ' . $e->getMessage());
            return false;
        }
    }

    public function get(string $key)
    {
        try {
            $url = $this->buildUrl($key);

            $response = $this->client->get($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiToken,
                ],
            ]);

            if ($response->getStatusCode() === 200) {
                return json_decode($response->getBody()->getContents(), true);
            }

            return null;
        } catch (GuzzleException $e) {
            \Log::error('Cloudflare KV Get Error: ' . $e->getMessage());
            return null;
        }
    }

    public function delete(string $key): bool
    {
        try {
            $url = $this->buildUrl($key);

            $response = $this->client->delete($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiToken,
                ],
            ]);

            return $response->getStatusCode() === 200;
        } catch (GuzzleException $e) {
            \Log::error('Cloudflare KV Delete Error: ' . $e->getMessage());
            return false;
        }
    }

    private function buildUrl(string $key): string
    {
        return sprintf(
            'https://api.cloudflare.com/client/v4/accounts/%s/storage/kv/namespaces/%s/values/%s',
            $this->accountId,
            $this->namespaceId,
            urlencode($key)
        );
    }

    public static function generateAvatarKey(string $type, string $id): string
    {
        return "{$type}_{$id}_avatar";
    }
}
