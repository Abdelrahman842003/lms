<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\AdminLoginRequest;
use App\Http\Requests\Auth\AdminRegisterRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\Admin\AdminResource;
use App\Http\Resources\Teacher\TeacherResource;
use App\Services\Admin\AdminService;
use App\Services\Admin\TeacherService;
use App\Services\Admin\StudentService;
use App\Services\Admin\DashboardService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected $adminService;
    protected $teacherService;
    protected $studentService;
    protected $dashboardService;

    public function __construct(
        AdminService $adminService,
        TeacherService $teacherService,
        StudentService $studentService,
        DashboardService $dashboardService
    ) {
        $this->adminService = $adminService;
        $this->teacherService = $teacherService;
        $this->studentService = $studentService;
        $this->dashboardService = $dashboardService;
    }

    public function login(AdminLoginRequest $request)
    {
        $data = $this->adminService->login($request->username, $request->password);

        // Generate Access Token (Short-lived - 30 mins by config)
        $accessToken = $data['user']->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;
        
        // Generate Refresh Token (Long-lived - 30 days)
        $refreshToken = $data['user']->createToken('refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        return $this->successResponse([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'user' => new AdminResource($data['user']),
            'role' => 'admin'
        ]);
    }

    public function register(AdminRegisterRequest $request)
    {
        $data = $this->adminService->register($request->validated());

        return $this->successResponse([
            'access_token' => $data['access_token'],
            'token_type' => $data['token_type'],
            'user' => new AdminResource($data['user']),
            'role' => 'admin'
        ], 'تم التسجيل بنجاح', 201);
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
            'user' => new AdminResource($request->user()),
            'role' => 'admin'
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        $admin = $this->adminService->updateProfile($request->user(), $request->validated());

        return $this->successResponse([
            'user' => new AdminResource($admin),
        ], 'تم تحديث الملف الشخصي بنجاح');
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $this->adminService->changePassword($request->user(), $request->current_password, $request->new_password);

        return $this->successResponse(null, 'تم تغيير كلمة المرور بنجاح');
    }

    public function getTeachers(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $teachers = $this->teacherService->getTeachers($perPage);
        return $this->successResponse(TeacherResource::collection($teachers)->response()->getData(true));
    }

    public function getStudents(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $students = $this->studentService->getStudents($perPage);
        return $this->successResponse(\App\Http\Resources\Student\StudentResource::collection($students)->response()->getData(true));
    }

    public function updateStudent(\App\Http\Requests\Auth\UpdateStudentRequest $request, \App\Models\Student $student)
    {
        $student = $this->studentService->updateStudent($student, $request->validated());
        return $this->successResponse([
            'student' => new \App\Http\Resources\Student\StudentResource($student)
        ], 'تم تحديث بيانات الطالب بنجاح');
    }

    public function dashboardStats()
    {
        $stats = $this->dashboardService->getStats();
        return $this->successResponse($stats);
    }
}
