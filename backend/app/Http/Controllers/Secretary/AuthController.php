<?php

namespace App\Http\Controllers\Secretary;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SecretaryLoginRequest;
use App\Http\Resources\Secretary\SecretaryResource;
use App\Services\Secretary\SecretaryService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected $secretaryService;

    public function __construct(SecretaryService $secretaryService)
    {
        $this->secretaryService = $secretaryService;
    }

    public function login(SecretaryLoginRequest $request)
    {
        $data = $this->secretaryService->login($request->username, $request->password);

        // Generate Access Token (Short-lived - 30 mins by config)
        $accessToken = $data['user']->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;
        
        // Generate Refresh Token (Long-lived - 30 days)
        $refreshToken = $data['user']->createToken('refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        return $this->successResponse([
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => new SecretaryResource($data['user']),
            'role' => 'secretary'
        ]);
    }

    public function logout(Request $request)
    {
        // Delete FCM token if provided
        if ($request->has('fcm_token')) {
            \App\Models\DeviceToken::where('tokenable_id', $request->user()->id)
                ->where('tokenable_type', get_class($request->user()))
                ->where('token', $request->fcm_token)
                ->delete();
        }

        // Delete current token
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return $this->successResponse(null, 'تم تسجيل الخروج بنجاح');
    }

    public function me(Request $request)
    {
        return $this->successResponse([
            'user' => new SecretaryResource($request->user()->load('teacher')),
            'role' => 'secretary'
        ]);
    }
}
