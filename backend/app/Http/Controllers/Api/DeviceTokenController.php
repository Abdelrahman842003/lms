<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\ApiResponseTrait;
use Illuminate\Support\Facades\Auth;

class DeviceTokenController extends Controller
{
    use ApiResponseTrait;

    public function store(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'device_type' => 'required|in:android,ios,web',
        ]);

        $user = Auth::user();

        if (!$user) {
             return $this->errorResponse('Unauthorized', 401);
        }

        // Use firstOrCreate to avoid unique constraint violation
        // We only want to store the token if it doesn't exist
        $user->deviceTokens()->firstOrCreate(
            ['token' => $request->token],
            [
                'device_type' => $request->device_type,
                'last_used_at' => now(),
            ]
        );
        
        // If it exists, we can optionally update the last_used_at
        // But firstOrCreate handles the insertion safely

        return $this->successResponse(null, 'Token stored successfully');
    }
}
