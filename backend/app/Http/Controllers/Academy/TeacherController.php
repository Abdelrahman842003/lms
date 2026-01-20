<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\DTOs\Academy\TeacherData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Academy\CheckTeacherPhoneRequest;
use App\Http\Requests\Academy\StoreTeacherRequest;
use App\Http\Resources\Academy\TeacherResource;
use App\Services\Academy\TeacherService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    public function __construct(
        private TeacherService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $academy = $request->user();

        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search');
        $status = $request->input('status');

        $teachers = $this->service->getTeachers($academy, $perPage, $search, $status);

        return $this->successResponse(TeacherResource::collection($teachers));
    }

    public function checkPhone(CheckTeacherPhoneRequest $request): JsonResponse
    {
        $phone = $request->validated('phone');
        $teacherData = $this->service->checkTeacherByPhone($phone);

        if (!$teacherData) {
            return $this->successResponse([
                'exists' => false,
                'teacher' => null,
            ]);
        }

        return $this->successResponse([
            'exists' => true,
            'teacher' => $teacherData,
        ]);
    }

    public function store(StoreTeacherRequest $request): JsonResponse
    {
        $academy = $request->user();

        // If teacher_id is provided, we link existing teacher
        if ($request->has('teacher_id')) {
            try {
                $teacherId = $request->validated('teacher_id');
                
                $teacher = $this->service->addTeacher($academy, $teacherId);
                
                return $this->successResponse(new TeacherResource($teacher), 'تم إضافة المدرس بنجاح', 201);
            } catch (\Exception $e) {
                return $this->errorResponse($e->getMessage(), 400);
            }
        }

        // Otherwise we create a new teacher
        try {
            $data = TeacherData::fromRequest($request);
            $teacher = $this->service->createTeacher($academy, $data);
            return $this->successResponse(new TeacherResource($teacher), 'تم إنشاء المدرس وإضافته بنجاح', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    public function update(\App\Http\Requests\Academy\UpdateTeacherRequest $request, string $id): JsonResponse
    {
        $academy = $request->user();
        
        try {
            $data = \App\DTOs\Academy\TeacherData::fromRequest($request);
            $teacher = $this->service->updateTeacher($academy, $id, $data);
            
            return $this->successResponse(new TeacherResource($teacher), 'تم تحديث بيانات المدرس بنجاح');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->endOfMonth()->toDateString());

        $data = $this->service->getTeacherWithLogs($academy, $id, $dateFrom, $dateTo);

        return $this->successResponse($data);
    }

    public function toggleStatus(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $isActive = $this->service->toggleStatus($academy, $id);

        return $this->successResponse([
            'message' => $isActive ? 'تم تفعيل المدرس' : 'تم تعطيل المدرس',
            'is_active' => $isActive,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $this->service->removeTeacher($academy, $id);

        return $this->successResponse([
            'message' => 'تم حذف المدرس من الأكاديمية بنجاح',
        ]);
    }
}
