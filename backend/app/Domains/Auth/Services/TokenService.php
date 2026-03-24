<?php

declare(strict_types=1);

namespace App\Domains\Auth\Services;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Sanctum\PersonalAccessToken;

class TokenService
{
    /**
     * Access token lifetime in minutes (15 minutes for security).
     */
    public const ACCESS_TOKEN_TTL_MINUTES = 15;

    /**
     * Refresh token lifetime in days (30 days maximum).
     * REDUCED FROM 365 DAYS for security compliance.
     */
    public const REFRESH_TOKEN_TTL_DAYS = 30;

    /**
     * Access token abilities.
     */
    private const ACCESS_TOKEN_ABILITIES = ['access-api'];

    /**
     * Refresh token abilities.
     */
    private const REFRESH_TOKEN_ABILITIES = ['refresh'];

    /**
     * Generate access and refresh tokens for a user.
     *
     * @param Model&HasApiTokens $user
     * @param string $deviceName Device identifier for token management
     * @return array{access: array{access_token: string, expires_at: string, token_type: string}, refresh: array{refresh_token: string, expires_at: string}}
     */
    public function generateTokenPair(Model $user, string $deviceName = 'web'): array
    {
        return [
            'access' => $this->createAccessToken($user),
            'refresh' => $this->createRefreshToken($user, $deviceName),
        ];
    }

    /**
     * Create a short-lived access token (15 minutes).
     *
     * @param Model&HasApiTokens $user
     * @return array{access_token: string, expires_at: string, token_type: string}
     */
    public function createAccessToken(Model $user): array
    {
        $accessToken = $user->createToken(
            'access-token',
            self::ACCESS_TOKEN_ABILITIES,
            now()->addMinutes(self::ACCESS_TOKEN_TTL_MINUTES)
        );

        return [
            'access_token' => $accessToken->plainTextToken,
            'expires_at' => $accessToken->accessToken->expires_at->toIso8601String(),
            'token_type' => 'Bearer',
        ];
    }

    /**
     * Create a refresh token (30 days max).
     * Revokes existing refresh tokens for the same device (rotation).
     *
     * @param Model&HasApiTokens $user
     * @param string $deviceName Device identifier for token management
     * @return array{refresh_token: string, expires_at: string}
     */
    public function createRefreshToken(Model $user, string $deviceName = 'web'): array
    {
        $tokenName = 'refresh-token-' . $deviceName;

        // Revoke existing refresh tokens for this device (rotation)
        $user->tokens()->where('name', $tokenName)->delete();

        $refreshToken = $user->createToken(
            $tokenName,
            self::REFRESH_TOKEN_ABILITIES,
            now()->addDays(self::REFRESH_TOKEN_TTL_DAYS)
        );

        return [
            'refresh_token' => $refreshToken->plainTextToken,
            'expires_at' => $refreshToken->accessToken->expires_at->toIso8601String(),
        ];
    }

    /**
     * Rotate tokens using a valid refresh token.
     * Implements token rotation: old refresh token is revoked, new pair is issued.
     *
     * @param string $refreshToken The refresh token string
     * @return array{access: array{access_token: string, expires_at: string, token_type: string}, refresh: array{refresh_token: string, expires_at: string}}
     * @throws \Exception If token is invalid, expired, or lacks refresh ability
     */
    public function rotateTokens(string $refreshToken): array
    {
        $token = PersonalAccessToken::findToken($refreshToken);

        if (!$token || !$token->can('refresh')) {
            throw new \Exception('Invalid refresh token');
        }

        // Check if refresh token is expired
        if ($token->expires_at && $token->expires_at->isPast()) {
            $token->delete();
            throw new \Exception('Refresh token expired');
        }

        $user = $token->tokenable;

        if (!$user) {
            $token->delete();
            throw new \Exception('User not found for token');
        }

        // Extract device name from token name
        $deviceName = str_replace('refresh-token-', '', $token->name);

        // Delete old refresh token (rotation - prevents token reuse)
        $token->delete();

        // Create new token pair
        return $this->generateTokenPair($user, $deviceName);
    }

    /**
     * Revoke all tokens for a user (logout from all devices).
     *
     * @param Model&HasApiTokens $user
     * @return void
     */
    public function revokeAllTokens(Model $user): void
    {
        $user->tokens()->delete();
    }

    /**
     * Revoke the current access token.
     *
     * @param Model&HasApiTokens $user
     * @return void
     */
    public function revokeCurrentToken(Model $user): void
    {
        $user->currentAccessToken()?->delete();
    }

    /**
     * Revoke specific token by name pattern.
     *
     * @param Model&HasApiTokens $user
     * @param string $tokenName Token name or pattern
     * @return void
     */
    public function revokeToken(Model $user, string $tokenName): void
    {
        $user->tokens()->where('name', 'like', $tokenName . '%')->delete();
    }

    /**
     * Revoke all tokens except the current one.
     *
     * @param Model&HasApiTokens $user
     * @return void
     */
    public function revokeOtherTokens(Model $user): void
    {
        $currentTokenId = $user->currentAccessToken()?->id;

        if ($currentTokenId) {
            $user->tokens()->where('id', '!=', $currentTokenId)->delete();
        }
    }

    /**
     * Validate a refresh token without rotating it.
     *
     * @param string $refreshToken
     * @return bool
     */
    public function validateRefreshToken(string $refreshToken): bool
    {
        $token = PersonalAccessToken::findToken($refreshToken);

        if (!$token || !$token->can('refresh')) {
            return false;
        }

        if ($token->expires_at && $token->expires_at->isPast()) {
            return false;
        }

        return true;
    }

    /**
     * Get token expiration time remaining in seconds.
     *
     * @param string $token
     * @return int|null Seconds until expiration, null if invalid
     */
    public function getTokenTimeToLive(string $token): ?int
    {
        $personalAccessToken = PersonalAccessToken::findToken($token);

        if (!$personalAccessToken || !$personalAccessToken->expires_at) {
            return null;
        }

        $ttl = now()->diffInSeconds($personalAccessToken->expires_at, false);

        return $ttl > 0 ? $ttl : null;
    }

    // ============================================
    // LEGACY METHODS - Maintained for backward compatibility
    // ============================================

    /**
     * Generate access and refresh tokens for a user (Legacy method).
     * @deprecated Use generateTokenPair() instead
     *
     * @param Model&HasApiTokens $user
     * @param bool $remember Ignored - TTL is now fixed at 30 days for security
     * @return array{access_token: string, refresh_token: string}
     */
    public function generateTokens(Model $user, bool $remember = false): array
    {
        $tokens = $this->generateTokenPair($user);

        return [
            'access_token' => $tokens['access']['access_token'],
            'refresh_token' => $tokens['refresh']['refresh_token'],
        ];
    }

    /**
     * Generate a short-lived access token (Legacy method).
     * @deprecated Use createAccessToken() instead
     *
     * @param Model&HasApiTokens $user
     * @return string
     */
    public function generateAccessToken(Model $user): string
    {
        return $user->createToken(
            'access_token',
            self::ACCESS_TOKEN_ABILITIES,
            now()->addMinutes(self::ACCESS_TOKEN_TTL_MINUTES)
        )->plainTextToken;
    }

    /**
     * Generate a long-lived refresh token (Legacy method).
     * @deprecated Use createRefreshToken() instead
     *
     * @param Model&HasApiTokens $user
     * @param bool $remember Ignored - TTL is now fixed at 30 days for security
     * @return string
     */
    public function generateRefreshToken(Model $user, bool $remember = false): string
    {
        $result = $this->createRefreshToken($user);
        return $result['refresh_token'];
    }

    /**
     * Refresh the access token using a valid refresh token (Legacy method).
     * @deprecated Use rotateTokens() instead for proper token rotation
     *
     * @param Model&HasApiTokens $user
     * @return array{access_token: string}|null
     */
    public function refreshAccessToken(Model $user): ?array
    {
        $currentToken = $user->currentAccessToken();

        if (!$currentToken || !$currentToken->can('refresh')) {
            return null;
        }

        // Check if refresh token is expired
        if ($currentToken->expires_at && $currentToken->expires_at->isPast()) {
            $currentToken->delete();
            return null;
        }

        // Generate new access token
        $accessToken = $this->generateAccessToken($user);

        return ['access_token' => $accessToken];
    }
}
