<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\DTOs\Auth\LoginData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\TeacherLoginRequest;
use App\Http\Requests\Teacher\Auth\UpdateProfileRequest;
use App\Http\Resources\Teacher\TeacherResource;
use App\Services\Auth\DeviceLimitService;
use App\Services\Auth\LoginAttemptService;
use App\Services\Teacher\TeacherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(
        private TeacherService $teacherService,
        private LoginAttemptService $loginAttemptService,
        private DeviceLimitService $deviceLimitService
    ) {}

    public function login(TeacherLoginRequest $request): JsonResponse
    {
        $data = LoginData::fromRequest($request);
        $result = $this->teacherService->login($data);

        if (!$result) {
            // Record failed attempt
            $attemptResult = $this->loginAttemptService->recordFailedAttempt(
                $data->phone,
                $request->ip()
            );

            $message = 'بيانات الدخول غير صحيحة';
            if (isset($attemptResult['attempts_remaining'])) {
                $message .= ' - متبقي ' . $attemptResult['attempts_remaining'] . ' محاولات';
            }

            return $this->errorResponse($message, 401, null, $attemptResult);
        }

        // Clear failed attempts on successful login
        $this->loginAttemptService->clearAttempts($data->phone, $request->ip());

        // Manage device limits (auto-removes oldest if at limit)
        $deviceResult = $this->deviceLimitService->checkAndManageDevices($result['user']);
        
        // Generate Access Token (Short-lived - 30 mins by config)
        $accessToken = $result['user']->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;
        
        // Generate Refresh Token (Long-lived - 30 days)
        $refreshToken = $result['user']->createToken('refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        return $this->successResponse([
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => new TeacherResource($result['user']),
            'role' => 'teacher',
            'device_removed' => $deviceResult['removed_device'] ?? false,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        // Delete FCM token if provided
        if ($request->has('fcm_token')) {
            \App\Models\DeviceToken::where('tokenable_id', $request->user()->id)
                ->where('tokenable_type', get_class($request->user()))
                ->where('token', $request->input('fcm_token'))
                ->delete();
        }

        // Delete current token
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return $this->successResponse(null, 'تم تسجيل الخروج بنجاح');
    }

    public function me(Request $request): JsonResponse
    {
        return $this->successResponse([
            'user' => new TeacherResource($request->user()),
            'role' => 'teacher'
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!Hash::check($request->validated('current_password'), $user->password)) {
            return $this->errorResponse('كلمة المرور الحالية غير صحيحة', 422);
        }

        $user->update([
            'password' => Hash::make($request->validated('new_password'))
        ]);

        return $this->successResponse(null, 'تم تغيير كلمة المرور بنجاح');
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->update($validated);

        return $this->successResponse([
            'user' => new TeacherResource($user->fresh()),
        ], 'تم تحديث الملف الشخصي بنجاح');
    }
}
