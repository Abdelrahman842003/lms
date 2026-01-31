<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\ApiResponseTrait;

class RefreshTokenController extends Controller
{
    use ApiResponseTrait;

    public function refresh(Request $request)
    {
        $user = $request->user();
        
        // Check if the current token has the ability to issue access tokens (i.e., it is a refresh token)
        if (!$user->currentAccessToken()->can('issue-access-token')) {
            return $this->errorResponse('Invalid token type. Refresh token required.', 403);
        }

        // Create a new access token
        $newAccessToken = $user->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;

        return $this->successResponse([
            'access_token' => $newAccessToken,
            'token_type' => 'Bearer',
        ], 'Token refreshed successfully');
    }
}
