<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Secretary;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Auth\SecretaryLoginRequest;
use App\Domains\Application\Http\Resources\Secretary\SecretaryResource;
use App\Domains\Auth\Services\DeviceLimitService;
use App\Domains\Auth\Services\LoginAttemptService;
use App\Domains\Application\Services\Secretary\SecretaryService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected $secretaryService;
    protected $loginAttemptService;
    protected $deviceLimitService;

    public function __construct(
        SecretaryService $secretaryService,
        LoginAttemptService $loginAttemptService,
        DeviceLimitService $deviceLimitService
    ) {
        $this->secretaryService = $secretaryService;
        $this->loginAttemptService = $loginAttemptService;
        $this->deviceLimitService = $deviceLimitService;
    }

    public function login(SecretaryLoginRequest $request)
    {
        $data = $this->secretaryService->login($request->phone, $request->password);

        if (!$data) {
            // Record failed attempt
            $attemptResult = $this->loginAttemptService->recordFailedAttempt(
                $request->phone,
                $request->ip()
            );

            $message = 'بيانات الدخول غير صحيحة';
            if (isset($attemptResult['attempts_remaining'])) {
                $message .= ' - متبقي ' . $attemptResult['attempts_remaining'] . ' محاولات';
            }

            return $this->errorResponse($message, 401, null, $attemptResult);
        }

        // Clear failed attempts on successful login
        $this->loginAttemptService->clearAttempts($request->phone, $request->ip());

        // Manage device limits (auto-removes oldest if at limit)
        $deviceResult = $this->deviceLimitService->checkAndManageDevices($data['user']);

        // Generate Access Token (Short-lived - 30 mins by config)
        $accessToken = $data['user']->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;
        
        // Generate Refresh Token (Long-lived - 30 days)
        $refreshToken = $data['user']->createToken('refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        return $this->successResponse([
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => new SecretaryResource($data['user']),
            'role' => 'secretary',
            'device_removed' => $deviceResult['removed_device'] ?? false,
        ]);
    }

    public function logout(Request $request)
    {
        // Delete FCM token if provided
        if ($request->has('fcm_token')) {
            \App\Domains\Auth\Models\DeviceToken::where('tokenable_id', $request->user()->id)
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
            'user' => new SecretaryResource($request->user()->load('teachers')),
            'role' => 'secretary'
        ]);
    }
}
