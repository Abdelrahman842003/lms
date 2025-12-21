<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Teacher\TeacherResource;
use App\Services\Admin\TeacherService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    use ApiResponseTrait;

    protected $teacherService;

    public function __construct(TeacherService $teacherService)
    {
        $this->teacherService = $teacherService;
    }

    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $filters = $request->only(['search', 'date_from', 'date_to']);
        $teachers = $this->teacherService->getTeachers($perPage, $filters);
        
        return $this->successResponse(
            TeacherResource::collection($teachers)->response()->getData(true)
        );
    }
    public function toggleStatus($id)
    {
        $teacher = $this->teacherService->toggleStatus($id);
        
        return $this->successResponse(
            new TeacherResource($teacher),
            'تم تغيير حالة المدرس بنجاح'
        );
    }

    public function loginAsTeacher($id)
    {
        $teacher = \App\Models\Teacher::findOrFail($id);
        
        // Create token for the teacher
        $token = $teacher->createToken('teacher_token', ['access-api'], now()->addMinutes(60))->plainTextToken;
        
        return $this->successResponse([
            'token' => $token,
            'user' => new TeacherResource($teacher),
            'role' => 'teacher'
        ], 'تم تسجيل الدخول بنجاح');
    }
}
