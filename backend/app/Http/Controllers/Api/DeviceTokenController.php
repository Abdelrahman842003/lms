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

        $user->deviceTokens()->updateOrCreate(
            ['token' => $request->token],
            [
                'device_type' => $request->device_type,
                'last_used_at' => now(),
            ]
        );

        return $this->successResponse(null, 'Token stored successfully');
    }
}
