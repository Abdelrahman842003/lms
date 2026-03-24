<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Api;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Auth\Services\TokenService;
use App\Domains\Support\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RefreshTokenController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private TokenService $tokenService
    ) {}

    /**
     * Refresh tokens using a valid refresh token.
     * Implements token rotation with reduced TTL (30 days max).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function refresh(Request $request): JsonResponse
    {
        $refreshToken = $this->extractRefreshToken($request);

        if (!$refreshToken) {
            return $this->errorResponse('Refresh token is required.', 401);
        }

        try {
            // Use the new TokenService with proper rotation and reduced TTL
            $tokens = $this->tokenService->rotateTokens($refreshToken);

            // Log deprecated endpoint usage if applicable
            if ($request->path() === 'api/v1/refresh-token') {
                Log::warning('Deprecated refresh endpoint used: /api/v1/refresh-token', [
                    'ip' => $request->ip(),
                ]);
            }

            return $this->successResponse([
                'access_token' => $tokens['access']['access_token'],
                'token' => $tokens['access']['access_token'],
                'refresh_token' => $tokens['refresh']['refresh_token'],
                'token_type' => 'Bearer',
                'access_expires_at' => $tokens['access']['expires_at'],
                'refresh_expires_at' => $tokens['refresh']['expires_at'],
            ], 'Token refreshed successfully');
        } catch (\Exception $e) {
            Log::warning('Token refresh failed', [
                'ip' => $request->ip(),
                'error' => $e->getMessage(),
            ]);

            return $this->errorResponse($e->getMessage(), 401);
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

        return $this->successResponse(null, 'Logged out successfully');
    }

    /**
     * Extract refresh token from request (header or cookie).
     *
     * @param Request $request
     * @return string|null
     */
    private function extractRefreshToken(Request $request): ?string
    {
        // Check Authorization header first
        $authHeader = $request->header('Authorization');
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            return trim(substr($authHeader, 7));
        }

        // Check request body
        if ($request->has('refresh_token')) {
            return $request->input('refresh_token');
        }

        // Check cookie
        return $request->cookie('refresh_token');
    }
}
