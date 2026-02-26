<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Auth\StudentLoginRequest;
use App\Domains\Application\Http\Resources\Student\StudentResource;
use App\Domains\Auth\Services\DeviceLimitService;
use App\Domains\Auth\Services\LoginAttemptService;
use App\Domains\Application\Services\Student\StudentService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected $studentService;
    protected $loginAttemptService;
    protected $deviceLimitService;

    public function __construct(
        StudentService $studentService,
        LoginAttemptService $loginAttemptService,
        DeviceLimitService $deviceLimitService
    ) {
        $this->studentService = $studentService;
        $this->loginAttemptService = $loginAttemptService;
        $this->deviceLimitService = $deviceLimitService;
    }

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

            return $this->errorResponse($message, 401, null, $attemptResult);
        }

        // Clear failed attempts on successful login
        $this->loginAttemptService->clearAttempts($request->phone, $request->ip());

        // Manage device limits (auto-removes oldest if at limit)
        $deviceResult = $this->deviceLimitService->checkAndManageDevices($data['user']);

        // Generate Access Token (Short-lived - 60 mins)
        $accessToken = $data['user']->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;
        
        // Generate Refresh Token (Long-lived - 30 days)
        $refreshToken = $data['user']->createToken('refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        return $this->successResponse([
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
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
                ->where('token', $request->fcm_token)
                ->delete();
        }

        // Delete current token
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
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

    public function changePassword(\App\Domains\Application\Http\Requests\Auth\ChangePasswordRequest $request)
    {
        $user = $request->user();

        if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
            return $this->errorResponse('كلمة المرور الحالية غير صحيحة', 422);
        }

        $user->update([
            'password' => \Illuminate\Support\Facades\Hash::make($request->new_password)
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
