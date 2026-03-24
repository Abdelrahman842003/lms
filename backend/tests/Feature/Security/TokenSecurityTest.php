<?php

use App\Models\User;
use App\Domains\Auth\Services\TokenService;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Token Security', function () {
    it('issues access token with 15-minute expiry', function () {
        $user = User::factory()->create();
        $tokenService = app(TokenService::class);
        
        $tokens = $tokenService->generateTokenPair($user, 'test-device');
        
        $accessToken = PersonalAccessToken::findToken($tokens['access_token']);
        
        expect($accessToken->expires_at)
            ->toBeInstanceOf(\Carbon\Carbon::class)
            ->and($accessToken->expires_at->diffInMinutes(now()))
            ->toBeLessThanOrEqual(16);
    });

    it('issues refresh token with 30-day expiry', function () {
        $user = User::factory()->create();
        $tokenService = app(TokenService::class);
        
        $tokens = $tokenService->generateTokenPair($user, 'test-device');
        
        $refreshToken = PersonalAccessToken::findToken($tokens['refresh_token']);
        
        expect($refreshToken->expires_at->diffInDays(now()))
            ->toBeLessThanOrEqual(31);
    });

    it('rotates tokens on refresh', function () {
        $user = User::factory()->create();
        $tokenService = app(TokenService::class);
        
        $originalTokens = $tokenService->generateTokenPair($user, 'test-device');
        $originalRefreshToken = $originalTokens['refresh_token'];
        
        $newTokens = $tokenService->rotateTokens($originalRefreshToken);
        
        // Old refresh token should be revoked
        $oldToken = PersonalAccessToken::findToken($originalRefreshToken);
        expect($oldToken)->toBeNull();
        
        // New tokens should be valid
        expect($newTokens)->toHaveKeys(['access', 'refresh']);
    });

    it('rejects expired refresh token', function () {
        $user = User::factory()->create();
        $tokenService = app(TokenService::class);
        
        $tokens = $tokenService->generateTokenPair($user, 'test-device');
        
        // Manually expire the token
        $token = PersonalAccessToken::findToken($tokens['refresh_token']);
        $token->update(['expires_at' => now()->subMinute()]);
        
        expect(fn() => $tokenService->rotateTokens($tokens['refresh_token']))
            ->toThrow(\Exception::class, 'Refresh token expired');
    });

    it('revokes all tokens on logout', function () {
        $user = User::factory()->create();
        $tokenService = app(TokenService::class);
        
        $tokenService->generateTokenPair($user, 'device-1');
        $tokenService->generateTokenPair($user, 'device-2');
        
        expect($user->tokens()->count())->toBe(4); // 2 pairs = 4 tokens
        
        $tokenService->revokeAllTokens($user);
        
        expect($user->fresh()->tokens)->toBeEmpty();
    });
});
