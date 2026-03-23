<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Auth\ChangePasswordRequest;
use App\Domains\Application\Http\Requests\Auth\StudentLoginRequest;
use App\Domains\Application\Http\Resources\Student\StudentResource;
use App\Domains\Auth\Services\DeviceLimitService;
use App\Domains\Auth\Services\LoginAttemptService;
use App\Domains\Auth\Services\TokenService;
use App\Domains\Application\Services\Student\StudentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(
        private StudentService $studentService,
        private LoginAttemptService $loginAttemptService,
        private DeviceLimitService $deviceLimitService,
        private TokenService $tokenService
    ) {}

    /**
     * Login with phone/username (no teacher_id required)
     */
    public function login(StudentLoginRequest $request)
    {
        $data = $this->studentService->login($request->phone, $request->password);

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

            return $this->errorResponse($message, null, 401, $attemptResult);
        }

        // Clear failed attempts on successful login
        $this->loginAttemptService->clearAttempts($request->phone, $request->ip());

        // Manage device limits (auto-removes oldest if at limit)
        $deviceResult = $this->deviceLimitService->checkAndManageDevices($data['user']);

        // Generate tokens using TokenService
        $tokens = $this->tokenService->generateTokens($data['user'], $request->boolean('remember', true));

        return $this->successResponse([
            'token' => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
            'user' => new StudentResource($data['user']),
            'teachers' => $data['teachers'],
            'role' => 'student',
            'device_removed' => $deviceResult['removed_device'] ?? false,
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        // Delete FCM token if provided
        if ($request->has('fcm_token')) {
            \App\Domains\Auth\Models\DeviceToken::where('tokenable_id', $request->user()->id)
                ->where('tokenable_type', get_class($request->user()))
                ->where('token', $request->input('fcm_token'))
                ->delete();
        }

        // Revoke current token using TokenService
        if ($request->user()) {
            $this->tokenService->revokeCurrentToken($request->user());
        }

        return $this->successResponse(null, 'تم تسجيل الخروج بنجاح');
    }

    /**
     * Get current user with enrolled teachers
     */
    public function me(Request $request)
    {
        $student = $request->user();
        $teachers = $this->studentService->getEnrolledTeachers($student);

        return $this->successResponse([
            'user' => new StudentResource($student),
            'teachers' => $teachers,
            'role' => 'student'
        ]);
    }

    public function changePassword(ChangePasswordRequest $request)
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

    /**
     * Get list of enrolled teachers (grouped by academy)
     */
    public function teachers(Request $request)
    {
        $student = $request->user();
        $teachers = $this->studentService->getEnrolledTeachersGrouped($student);

        return $this->successResponse($teachers);
    }

    /**
     * Get dashboard for a specific teacher
     */
    public function teacherDashboard(Request $request, string $teacherId)
    {
        $student = $request->user();
        $dashboard = $this->studentService->getTeacherDashboard($student, $teacherId);

        return $this->successResponse($dashboard);
    }
}
