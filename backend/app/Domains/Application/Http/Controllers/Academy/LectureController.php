<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Lectures\DTOs\LectureData;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\Lecture\StoreLectureRequest;
use App\Domains\Application\Http\Requests\Academy\Lecture\UpdateLectureRequest;
use App\Domains\Application\Http\Requests\Teacher\Lecture\RecordAttendanceRequest;
use App\Domains\Application\Http\Resources\Teacher\LectureResource;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Application\Services\Academy\LectureService;
use App\Domains\Application\Traits\ResolvesAcademy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LectureController extends Controller
{
    use ResolvesAcademy;
    
    public function __construct(
        private LectureService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'teacher_id', 'status', 'group_id']);
        
        $lectures = $this->service->getLectures($academy, $filters, $perPage);

        return $this->successResponse(
            LectureResource::collection($lectures)->response()->getData(true)
        );
    }

    public function store(StoreLectureRequest $request): JsonResponse
    {
        try {
            $academy = $this->getAcademy($request);
            if (!$academy) {
                return $this->errorResponse('Unauthorized', 403);
            }

            $data = LectureData::fromRequest($request);
            $lecture = $this->service->createLecture($academy, $data);

            return $this->successResponse([
                'lecture' => new LectureResource($lecture),
                'message' => 'تم إضافة المحاضرة بنجاح'
            ], 'تم إضافة المحاضرة بنجاح', 201);
        } catch (\Exception $e) {
            Log::error('Academy Lecture creation failed: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(Request $request, Lecture $lecture): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        return $this->successResponse([
            'lecture' => new LectureResource($lecture->load(['grade', 'group', 'teacher']))
        ]);
    }

    public function update(UpdateLectureRequest $request, Lecture $lecture): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $data = LectureData::fromRequest($request);
        $lecture = $this->service->updateLecture($academy, $lecture, $data);

        return $this->successResponse([
            'lecture' => new LectureResource($lecture),
            'message' => 'تم تحديث المحاضرة بنجاح'
        ]);
    }

    public function destroy(Request $request, Lecture $lecture): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $this->service->deleteLecture($lecture);

        return $this->successResponse([
            'message' => 'تم حذف المحاضرة بنجاح'
        ]);
    }

    public function toggleActive(Request $request, Lecture $lecture): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $newState = $request->has('is_active') ? filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN) : null;
        $lecture = $this->service->toggleActive($lecture, $newState);

        return $this->successResponse([
            'message' => $lecture->is_active ? 'تم تفعيل المحاضرة' : 'تم إلغاء تفعيل المحاضرة',
            'is_active' => $lecture->is_active
        ]);
    }

    public function endLecture(Request $request, Lecture $lecture): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $this->service->endLecture($lecture);

        return $this->successResponse([
            'message' => 'تم إنهاء المحاضرة',
            'lecture' => new LectureResource($lecture->fresh())
        ]);
    }

    public function generateQrCode(Request $request, Lecture $lecture): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $qrData = $this->service->generateQrCode($lecture);

        return $this->successResponse($qrData);
    }

    public function getAttendees(Request $request, Lecture $lecture): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $filters = [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
        ];

        $data = $this->service->getAttendees($lecture, $filters);

        return $this->successResponse([
            'lecture' => [
                'id' => $lecture->id,
                'title' => $lecture->title,
                'teacher_name' => $lecture->teacher->name,
            ],
            'attendees' => $data['attendees'],
            'total_present' => $data['total_present'],
            'total_absent' => $data['total_absent'],
        ]);
    }

    public function recordAttendance(RecordAttendanceRequest $request, Lecture $lecture): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $result = $this->service->recordAttendance($lecture, $request->validated('student_id'));

        return $this->successResponse($result);
    }

    public function getTeachers(Request $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $teachers = $academy->teachers()
            ->wherePivot('is_active', true)
            ->where('teachers.status', 'active')
            ->select('teachers.id', 'teachers.name', 'teachers.phone')
            ->get();

        return $this->successResponse([
            'teachers' => $teachers
        ]);
    }

    private function canAccessLecture($academy, Lecture $lecture): bool
    {
        // Academy owns this lecture directly
        if ($lecture->academy_id === $academy->id) {
            return true;
        }

        // Teacher of this lecture belongs to the academy
        $teacherBelongsToAcademy = $lecture->teacher->academies()
            ->where('academies.id', $academy->id)
            ->where('academy_teacher.is_active', true)
            ->exists();

        return $teacherBelongsToAcademy;
    }
}
