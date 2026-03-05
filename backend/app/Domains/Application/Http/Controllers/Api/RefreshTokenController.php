<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Api;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Support\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;

class RefreshTokenController extends Controller
{
    use ApiResponseTrait;

    public function refresh(Request $request): JsonResponse
    {
        $refreshToken = $this->extractRefreshToken($request);
        if (!$refreshToken) {
            return $this->errorResponse('Refresh token is required.', 401);
        }

        $token = PersonalAccessToken::findToken($refreshToken);
        if (!$token) {
            return $this->errorResponse('Invalid refresh token.', 401);
        }

        if (!$token->can('issue-access-token')) {
            return $this->errorResponse('Invalid token type. Refresh token required.', 403);
        }

        if ($token->expires_at && $token->expires_at->isPast()) {
            return $this->errorResponse('Refresh token has expired.', 401);
        }

        $user = $token->tokenable;
        if (!$user) {
            return $this->errorResponse('Invalid refresh token.', 401);
        }

        if ($request->path() === 'api/v1/refresh-token') {
            Log::warning('Deprecated refresh endpoint used: /api/v1/refresh-token', [
                'ip' => $request->ip(),
                'user_id' => $user->id,
                'user_type' => get_class($user),
            ]);
        }

        $newAccessToken = $user->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;
        $newRefreshToken = $user->createToken('refresh_token', ['issue-access-token'], now()->addDays(365))->plainTextToken;

        // Rotate refresh token to reduce replay risk.
        $token->delete();

        return $this->successResponse([
            'access_token' => $newAccessToken,
            'token' => $newAccessToken,
            'refresh_token' => $newRefreshToken,
            'token_type' => 'Bearer',
        ], 'Token refreshed successfully');
    }

    private function extractRefreshToken(Request $request): ?string
    {
        $authHeader = $request->header('Authorization');
        if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
            return trim(substr($authHeader, 7));
        }

        return $request->cookie('refresh_token');
    }
}
