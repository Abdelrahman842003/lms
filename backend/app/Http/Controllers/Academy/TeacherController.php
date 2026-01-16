<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Services\Academy\TeacherService;
use App\Http\Requests\Academy\StoreTeacherRequest;
use App\DTOs\Academy\TeacherData;
use App\Http\Resources\Academy\TeacherResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class TeacherController extends Controller
{
    public function __construct(
        private TeacherService $teacherService
    ) {}

    /**
     * Get list of teachers in academy
     */
    public function index(Request $request): JsonResponse
    {
        $academy = $request->user();

        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search');
        $status = $request->input('status');

        $teachers = $this->teacherService->getTeachers($academy, $perPage, $search, $status);

        return $this->successResponse(TeacherResource::collection($teachers));
    }

    /**
     * Check if teacher exists by phone number
     */
    public function checkPhone(\App\Http\Requests\Academy\CheckTeacherPhoneRequest $request): JsonResponse
    {
        $phone = $request->validated('phone');
        $teacherData = $this->teacherService->checkTeacherByPhone($phone);

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


    /**
     * Add teacher to academy
     */
    public function store(StoreTeacherRequest $request): JsonResponse
    {
        $academy = $request->user();

        // If teacher_id is provided, we link existing teacher
        if ($request->has('teacher_id')) {
            try {
                $teacherId = $request->validated('teacher_id');
                
                $teacher = $this->teacherService->addTeacher($academy, $teacherId);
                
                // Check if this was a reactivation or new addition
                $message = 'تم إضافة المدرس بنجاح';
                
                return $this->successResponse(new TeacherResource($teacher), $message, 201);
            } catch (\Exception $e) {
                return $this->errorResponse($e->getMessage(), 400);
            }
        }

        // Otherwise we create a new teacher
        try {
            $data = TeacherData::fromRequest($request);
            $teacher = $this->teacherService->createTeacher($academy, $data);
            return $this->successResponse(new TeacherResource($teacher), 'تم إنشاء المدرس وإضافته بنجاح', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Get teacher details with attendance logs
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo = $request->input('date_to', Carbon::now()->endOfMonth()->toDateString());

        $data = $this->teacherService->getTeacherWithLogs($academy, $id, $dateFrom, $dateTo);

        return $this->successResponse($data);
    }

    /**
     * Toggle teacher status in academy
     */
    public function toggleStatus(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $isActive = $this->teacherService->toggleStatus($academy, $id);

        return $this->successResponse([
            'message' => $isActive ? 'تم تفعيل المدرس' : 'تم تعطيل المدرس',
            'is_active' => $isActive,
        ]);
    }

    /**
     * Remove teacher from academy
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $academy = $request->user();

        $this->teacherService->removeTeacher($academy, $id);

        return $this->successResponse([
            'message' => 'تم حذف المدرس من الأكاديمية بنجاح',
        ]);
    }
}
