<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Admin;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Auth\AdminLoginRequest;
use App\Domains\Application\Http\Requests\Auth\AdminRegisterRequest;
use App\Domains\Application\Http\Requests\Auth\ChangePasswordRequest;
use App\Domains\Application\Http\Requests\Auth\UpdateProfileRequest;
use App\Domains\Application\Http\Resources\Admin\AdminResource;
use App\Domains\Application\Http\Resources\Teacher\TeacherResource;
use App\Domains\Application\Services\Admin\AdminService;
use App\Domains\Application\Services\Admin\TeacherService;
use App\Domains\Application\Services\Admin\StudentService;
use App\Domains\Application\Services\Admin\DashboardService;
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

        return $this->successResponse([
            'access_token' => $data['access_token'],
            'refresh_token' => $data['refresh_token'],
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
        $this->adminService->logout($request->user(), $request->fcm_token);

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
        return $this->successResponse(\App\Domains\Application\Http\Resources\Student\StudentResource::collection($students)->response()->getData(true));
    }

    public function updateStudent(\App\Domains\Application\Http\Requests\Auth\UpdateStudentRequest $request, \App\Domains\Auth\Models\Student $student)
    {
        $student = $this->studentService->updateStudent($student, $request->validated());
        return $this->successResponse([
            'student' => new \App\Domains\Application\Http\Resources\Student\StudentResource($student)
        ], 'تم تحديث بيانات الطالب بنجاح');
    }

    public function dashboardStats()
    {
        $stats = $this->dashboardService->getStats();
        return $this->successResponse($stats);
    }
}
