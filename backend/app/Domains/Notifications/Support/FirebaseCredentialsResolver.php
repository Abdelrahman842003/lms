<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Support;

final class FirebaseCredentialsResolver
{
    /**
     * @return array{auth_config: array<string, mixed>|string, project_id: string}|null
     */
    public static function resolve(): ?array
    {
        $credentials = config('services.firebase.credentials');
        $projectId = trim((string) config('services.firebase.project_id', ''));

        $resolved = self::normalizeCredentials($credentials);

        if ($resolved === null) {
            $fallbackPath = trim((string) (env('GOOGLE_APPLICATION_CREDENTIALS') ?? ''));
            $resolved = self::normalizeCredentials($fallbackPath);
        }

        if ($resolved === null) {
            $resolved = self::normalizeCredentials(storage_path('firebase-credentials.json'));
        }

        if ($resolved === null) {
            return null;
        }

        if ($projectId === '') {
            $projectId = self::extractProjectId($resolved);
        }

        return [
            'auth_config' => $resolved,
            'project_id' => $projectId,
        ];
    }

    /**
     * @param mixed $credentials
     * @return array<string, mixed>|string|null
     */
    private static function normalizeCredentials(mixed $credentials): array|string|null
    {
        if (is_array($credentials)) {
            return $credentials !== [] ? $credentials : null;
        }

        if (! is_string($credentials)) {
            return null;
        }

        $value = trim($credentials);

        if ($value === '') {
            return null;
        }

        // 1. Try JSON directly
        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }

        // 2. Try as a file path
        if (is_file($value)) {
            return $value;
        }

        // 3. Try as Base64 encoded JSON
        $base64Decoded = base64_decode($value, true);
        if ($base64Decoded !== false) {
            $decoded = json_decode($base64Decoded, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed>|string $credentials
     */
    private static function extractProjectId(array|string $credentials): string
    {
        if (is_array($credentials)) {
            return trim((string) ($credentials['project_id'] ?? ''));
        }

        if (! is_file($credentials)) {
            return '';
        }

        $decoded = json_decode((string) file_get_contents($credentials), true);

        return is_array($decoded) ? trim((string) ($decoded['project_id'] ?? '')) : '';
    }
}
