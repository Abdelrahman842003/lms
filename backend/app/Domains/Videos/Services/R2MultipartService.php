<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use Aws\S3\S3Client;
use Illuminate\Support\Facades\Log;

/**
 * Wraps Cloudflare R2 (S3-compatible) multipart upload operations.
 * The server NEVER touches video bytes — it only manages upload sessions
 * and generates short-lived presigned URLs that the browser uses directly.
 *
 * Credentials come from config('filesystems.disks.r2.*'), which is populated
 * at boot time by SettingsServiceProvider from the encrypted DB settings
 * (cloudflare_r2_* keys), falling back to .env values when no DB row exists.
 */
class R2MultipartService
{
    private S3Client $client;
    private string $bucket;

    public function __construct()
    {
        $this->bucket = (string) config('filesystems.disks.r2.bucket');

        $this->client = new S3Client([
            'version'                 => 'latest',
            'region'                  => 'auto',
            'endpoint'                => (string) config('filesystems.disks.r2.endpoint'),
            'use_path_style_endpoint' => false,
            'credentials'             => [
                'key'    => (string) config('filesystems.disks.r2.key'),
                'secret' => (string) config('filesystems.disks.r2.secret'),
            ],
        ]);
    }

    /**
     * Step 1: Create a multipart upload on R2.
     * Returns the UploadId issued by R2.
     */
    public function createMultipartUpload(string $objectKey, string $contentType): string
    {
        $result = $this->client->createMultipartUpload([
            'Bucket'             => $this->bucket,
            'Key'                => $objectKey,
            'ContentType'        => $contentType,
            'ACL'                => 'private',
        ]);

        return (string) $result['UploadId'];
    }

    /**
     * Step 2: Generate a presigned URL for a single part.
     * The browser will PUT directly to this URL.
     *
     * @param int $ttlSeconds  How long the presigned URL stays valid.
     */
    public function presignPartUrl(
        string $objectKey,
        string $uploadId,
        int $partNumber,
        int $ttlSeconds = 3600
    ): string {
        $cmd = $this->client->getCommand('UploadPart', [
            'Bucket'     => $this->bucket,
            'Key'        => $objectKey,
            'UploadId'   => $uploadId,
            'PartNumber' => $partNumber,
        ]);

        $request = $this->client->createPresignedRequest($cmd, "+{$ttlSeconds} seconds");

        return (string) $request->getUri();
    }

    /**
     * Batch-generate presigned part URLs for all parts up-front.
     *
     * @param  int  $totalParts
     * @return array<int, string>  Indexed by 1-based part number.
     */
    public function presignAllPartUrls(
        string $objectKey,
        string $uploadId,
        int $totalParts,
        int $ttlSeconds = 3600
    ): array {
        $urls = [];
        for ($part = 1; $part <= $totalParts; $part++) {
            $urls[$part] = $this->presignPartUrl($objectKey, $uploadId, $part, $ttlSeconds);
        }

        return $urls;
    }

    /**
     * Generate a presigned PUT URL for a single-part upload.
     * Ideal for smaller files like attachments (still avoids server bytes).
     */
    public function presignPutUrl(string $objectKey, ?string $contentType = null, int $ttlSeconds = 3600): string
    {
        $params = [
            'Bucket' => $this->bucket,
            'Key'    => $objectKey,
        ];

        if ($contentType) {
            $params['ContentType'] = $contentType;
        }

        $cmd = $this->client->getCommand('PutObject', $params);

        $request = $this->client->createPresignedRequest($cmd, "+{$ttlSeconds} seconds");

        return (string) $request->getUri();
    }

    /**
     * Step 3: Complete the multipart upload.
     * $parts format: [ ['PartNumber' => 1, 'ETag' => '"abc..."'], ... ]
     *
     * @param  array<int, array{PartNumber: int, ETag: string}>  $parts
     */
    public function completeMultipartUpload(
        string $objectKey,
        string $uploadId,
        array $parts
    ): bool {
        // Sort parts by PartNumber ascending (R2 requirement)
        usort($parts, static fn ($a, $b) => $a['PartNumber'] <=> $b['PartNumber']);

        $this->client->completeMultipartUpload([
            'Bucket'          => $this->bucket,
            'Key'             => $objectKey,
            'UploadId'        => $uploadId,
            'MultipartUpload' => ['Parts' => $parts],
        ]);

        return true;
    }

    /**
     * List all uploaded parts for a multipart upload session.
     * Used by the server to fetch ETags without requiring the browser to send them.
     *
     * @return array<int, array{PartNumber: int, ETag: string}>
     */
    public function listParts(string $objectKey, string $uploadId): array
    {
        $parts   = [];
        $marker  = 0;

        do {
            $params = [
                'Bucket'           => $this->bucket,
                'Key'              => $objectKey,
                'UploadId'         => $uploadId,
                'PartNumberMarker' => $marker,
            ];

            $result    = $this->client->listParts($params);
            $fetched   = $result['Parts'] ?? [];

            foreach ($fetched as $p) {
                $parts[] = [
                    'PartNumber' => (int) $p['PartNumber'],
                    'ETag'       => (string) $p['ETag'],
                ];
            }

            $isTruncated = (bool) ($result['IsTruncated'] ?? false);
            $marker      = (int) ($result['NextPartNumberMarker'] ?? 0);
        } while ($isTruncated);

        return $parts;
    }

    /**
     * Abort an in-progress multipart upload, cleaning up parts on R2.
     */
    public function abortMultipartUpload(string $objectKey, string $uploadId): void
    {
        try {
            $this->client->abortMultipartUpload([
                'Bucket'   => $this->bucket,
                'Key'      => $objectKey,
                'UploadId' => $uploadId,
            ]);
        } catch (\Throwable $e) {
            // Log but do not rethrow — the upload may have already been completed or expired.
            Log::warning('R2 abortMultipartUpload failed (possibly already cleaned up)', [
                'object_key' => $objectKey,
                'upload_id'  => $uploadId,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check whether the object actually exists in R2 after completing upload.
     * Used as a finalize verification step.
     */
    public function objectExists(string $objectKey): bool
    {
        try {
            $this->client->headObject([
                'Bucket' => $this->bucket,
                'Key'    => $objectKey,
            ]);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Get object metadata (size, content-type) from R2 for finalize verification.
     *
     * @return array{size: int, content_type: string}|null
     */
    public function objectMeta(string $objectKey): ?array
    {
        try {
            $result = $this->client->headObject([
                'Bucket' => $this->bucket,
                'Key'    => $objectKey,
            ]);

            return [
                'size'         => (int) ($result['ContentLength'] ?? 0),
                'content_type' => (string) ($result['ContentType'] ?? ''),
            ];
        } catch (\Throwable) {
            return null;
        }
    }
}
