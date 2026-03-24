<?php

declare(strict_types=1);

namespace App\Domains\Auth\Http\Controllers;

use App\Domains\Auth\Services\TokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TokenController
{
    /**
     * TokenController constructor.
     */
    public function __construct(
        private TokenService $tokenService
    ) {}

    /**
     * Refresh tokens using a valid refresh token.
     * Implements token rotation - old refresh token is revoked.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function refresh(Request $request): JsonResponse
    {
        $request->validate([
            'refresh_token' => 'required|string',
        ]);

        try {
            $tokens = $this->tokenService->rotateTokens($request->refresh_token);

            return response()->json([
                'message' => 'Token refreshed successfully',
                'data' => $tokens,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Token refresh failed',
                'error' => $e->getMessage(),
            ], 401);
        }
    }

    /**
     * Logout user by revoking all tokens.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $this->tokenService->revokeAllTokens($request->user());

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Logout from current device only (revoke current token).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logoutCurrent(Request $request): JsonResponse
    {
        $this->tokenService->revokeCurrentToken($request->user());

        return response()->json([
            'message' => 'Logged out from current device successfully',
        ]);
    }

    /**
     * Logout from all other devices (keep current token).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logoutOtherDevices(Request $request): JsonResponse
    {
        $this->tokenService->revokeOtherTokens($request->user());

        return response()->json([
            'message' => 'Logged out from all other devices successfully',
        ]);
    }

    /**
     * Get token information and time to live.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function tokenInfo(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentToken = $user->currentAccessToken();

        if (!$currentToken) {
            return response()->json([
                'message' => 'No active token found',
            ], 404);
        }

        $ttl = null;
        if ($currentToken->expires_at) {
            $ttl = now()->diffInSeconds($currentToken->expires_at, false);
            $ttl = $ttl > 0 ? $ttl : 0;
        }

        return response()->json([
            'data' => [
                'token_name' => $currentToken->name,
                'abilities' => $currentToken->abilities,
                'expires_at' => $currentToken->expires_at?->toIso8601String(),
                'time_to_live_seconds' => $ttl,
                'is_expired' => $currentToken->expires_at && $currentToken->expires_at->isPast(),
            ],
        ]);
    }

    /**
     * Validate a refresh token without using it.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function validateRefreshToken(Request $request): JsonResponse
    {
        $request->validate([
            'refresh_token' => 'required|string',
        ]);

        $isValid = $this->tokenService->validateRefreshToken($request->refresh_token);

        return response()->json([
            'valid' => $isValid,
            'message' => $isValid ? 'Refresh token is valid' : 'Refresh token is invalid or expired',
        ]);
    }
}
