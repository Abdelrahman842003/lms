<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\StudentLoginRequest;
use App\Http\Resources\Student\StudentResource;
use App\Services\Student\StudentService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected $studentService;

    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
    }

    /**
     * Login with phone/username (no teacher_id required)
     */
    public function login(StudentLoginRequest $request)
    {
        $data = $this->studentService->login($request->identifier, $request->password);

        // Generate Access Token (Short-lived - 60 mins)
        $accessToken = $data['user']->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;
        
        // Generate Refresh Token (Long-lived - 30 days)
        $refreshToken = $data['user']->createToken('refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        return $this->successResponse([
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => new StudentResource($data['user']),
            'teachers' => $data['teachers'],
            'role' => 'student'
        ]);
    }

    /**
     * Logout
     */
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

    /**
     * Get list of enrolled teachers
     */
    public function teachers(Request $request)
    {
        $student = $request->user();
        $teachers = $this->studentService->getEnrolledTeachers($student);

        return $this->successResponse([
            'teachers' => $teachers
        ]);
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
