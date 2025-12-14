<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\StoreTeacherRequest;
use App\Http\Resources\Teacher\TeacherResource;
use App\Services\Teacher\TeacherService;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    protected $teacherService;

    public function __construct(TeacherService $teacherService)
    {
        $this->teacherService = $teacherService;
    }

    public function register(StoreTeacherRequest $request)
    {
        $teacher = $this->teacherService->createTeacher($request->validated());

        return $this->successResponse([
            'teacher' => new TeacherResource($teacher)
        ], 'Teacher registered successfully');
    }
    public function store(StoreTeacherRequest $request)
    {
        $teacher = $this->teacherService->createTeacher($request->validated());

        return $this->successResponse([
            'teacher' => new TeacherResource($teacher)
        ], 'تم إضافة المدرس بنجاح');
    }
    public function show($id)
    {
        $teacher = $this->teacherService->getTeacherDetails($id);

        return $this->successResponse([
            'teacher' => new TeacherResource($teacher)
        ], 'Teacher details retrieved successfully');
    }
}
