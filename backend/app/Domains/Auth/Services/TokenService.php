<?php

declare(strict_types=1);

namespace App\Domains\Auth\Services;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class TokenService
{
    /**
     * Default access token lifetime in minutes.
     */
    private const ACCESS_TOKEN_LIFETIME_MINUTES = 60;

    /**
     * Default refresh token lifetime in days (when remember = false).
     */
    private const REFRESH_TOKEN_LIFETIME_DAYS = 30;

    /**
     * Extended refresh token lifetime in days (when remember = true).
     */
    private const REFRESH_TOKEN_LIFETIME_EXTENDED_DAYS = 365;

    /**
     * Access token abilities.
     */
    private const ACCESS_TOKEN_ABILITIES = ['access-api'];

    /**
     * Refresh token abilities.
     */
    private const REFRESH_TOKEN_ABILITIES = ['issue-access-token'];

    /**
     * Generate access and refresh tokens for a user.
     *
     * @param Model&HasApiTokens $user
     * @param bool $remember Whether to extend refresh token lifetime
     * @return array{access_token: string, refresh_token: string}
     */
    public function generateTokens(Model $user, bool $remember = false): array
    {
        return [
            'access_token' => $this->generateAccessToken($user),
            'refresh_token' => $this->generateRefreshToken($user, $remember),
        ];
    }

    /**
     * Generate a short-lived access token.
     *
     * @param Model&HasApiTokens $user
     * @return string
     */
    public function generateAccessToken(Model $user): string
    {
        return $user->createToken(
            'access_token',
            self::ACCESS_TOKEN_ABILITIES,
            now()->addMinutes(self::ACCESS_TOKEN_LIFETIME_MINUTES)
        )->plainTextToken;
    }

    /**
     * Generate a long-lived refresh token.
     *
     * @param Model&HasApiTokens $user
     * @param bool $remember Whether to extend the lifetime
     * @return string
     */
    public function generateRefreshToken(Model $user, bool $remember = false): string
    {
        $lifetimeDays = $remember
            ? self::REFRESH_TOKEN_LIFETIME_EXTENDED_DAYS
            : self::REFRESH_TOKEN_LIFETIME_DAYS;

        return $user->createToken(
            'refresh_token',
            self::REFRESH_TOKEN_ABILITIES,
            now()->addDays($lifetimeDays)
        )->plainTextToken;
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
     * Revoke all tokens for a user.
     *
     * @param Model&HasApiTokens $user
     * @return void
     */
    public function revokeAllTokens(Model $user): void
    {
        $user->tokens()->delete();
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
     * Refresh the access token using a valid refresh token.
     *
     * @param Model&HasApiTokens $user
     * @return array{access_token: string}|null
     */
    public function refreshAccessToken(Model $user): ?array
    {
        $currentToken = $user->currentAccessToken();
        
        if (!$currentToken || !$currentToken->can('issue-access-token')) {
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
