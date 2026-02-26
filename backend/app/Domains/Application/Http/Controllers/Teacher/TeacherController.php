<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\StoreTeacherRequest;
use App\Domains\Application\Http\Requests\Teacher\UpdateTeacherRequest;
use App\Domains\Application\Http\Resources\Teacher\TeacherResource;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Application\Services\Teacher\TeacherService;
use Illuminate\Http\JsonResponse;

class TeacherController extends Controller
{
    public function __construct(
        private TeacherService $teacherService
    ) {}

    public function register(StoreTeacherRequest $request): JsonResponse
    {
        $teacher = $this->teacherService->createTeacher($request->validated());

        return $this->successResponse([
            'teacher' => new TeacherResource($teacher)
        ], 'Teacher registered successfully');
    }

    public function store(StoreTeacherRequest $request): JsonResponse
    {
        $teacher = $this->teacherService->createTeacher($request->validated());

        return $this->successResponse([
            'teacher' => new TeacherResource($teacher)
        ], 'تم إضافة المدرس بنجاح');
    }

    public function show(string $id): JsonResponse
    {
        $teacher = $this->teacherService->getTeacherDetails($id);

        return $this->successResponse([
            'teacher' => new TeacherResource($teacher)
        ], 'Teacher details retrieved successfully');
    }

    public function update(UpdateTeacherRequest $request, Teacher $teacher): JsonResponse
    {
        $teacher = $this->teacherService->updateTeacher($teacher, $request->validated());

        return $this->successResponse([
            'teacher' => new TeacherResource($teacher)
        ], 'تم تحديث بيانات المدرس بنجاح');
    }
}
