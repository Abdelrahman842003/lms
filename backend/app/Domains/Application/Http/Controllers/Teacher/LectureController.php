<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Lectures\DTOs\TeacherLectureData;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Lecture\CancelSessionRequest;
use App\Domains\Application\Http\Requests\Teacher\Lecture\StoreLectureRequest;
use App\Domains\Application\Http\Requests\Teacher\Lecture\UpdateLectureRequest;
use App\Domains\Application\Http\Resources\Teacher\LectureResource;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Application\Services\Teacher\LectureService;
use App\Domains\Application\Services\Teacher\LectureExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class LectureController extends Controller
{
    use \App\Domains\Support\Traits\ResolvesTeacher;
    use \App\Domains\Application\Http\Controllers\Traits\ResolvesOwnedResources;

    public function __construct(
        private LectureService $service,
        private LectureExportService $exportService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'date_from', 'date_to', 'group_id', 'status']);
        $academyId = $request->header('X-Academy-Id') ?? $request->input('academy_id');
        
        $lectures = $this->service->getLectures($teacher, $perPage, $filters, $academyId);
        $lectures->load('current_session');
        
        return $this->successResponse(
            LectureResource::collection($lectures)->response()->getData(true)
        );
    }

    public function store(StoreLectureRequest $request): JsonResponse
    {
        try {
            $teacher = $this->getTeacherFromRequest($request);
            
            $lectureData = LectureData::fromRequest($request);
            $lecture = $this->service->createLecture($teacher, $lectureData->toArray());

            return $this->successResponse([
                'lecture' => new LectureResource($lecture),
                'message' => 'تم إضافة المحاضرة بنجاح'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Lecture creation failed: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    public function show(Request $request, Lecture $lecture): JsonResponse
    {
        Gate::authorize('view', $lecture);

        return $this->successResponse([
            'lecture' => new LectureResource($lecture->load(['grade', 'group']))
        ]);
    }

    public function update(UpdateLectureRequest $request, Lecture $lecture): JsonResponse
    {
        Gate::authorize('update', $lecture);

        $lectureData = LectureData::fromRequest($request);
        $lecture = $this->service->updateLecture($lecture, $lectureData->toArray());
        
        return $this->successResponse([
            'lecture' => new LectureResource($lecture),
            'message' => 'تم تحديث المحاضرة بنجاح'
        ]);
    }

    public function destroy(Request $request, Lecture $lecture): JsonResponse
    {
        Gate::authorize('delete', $lecture);

        $this->service->deleteLecture($lecture);

        return $this->successResponse([
            'message' => 'تم حذف المحاضرة بنجاح'
        ]);
    }

    public function toggleActive(Request $request, Lecture $lecture): JsonResponse
    {
        Gate::authorize('toggleActive', $lecture);

        $lecture = $this->service->toggleActive($lecture);

        return $this->successResponse([
            'message' => $lecture->is_active ? 'تم تفعيل المحاضرة' : 'تم إلغاء تفعيل المحاضرة',
            'is_active' => $lecture->is_active
        ]);
    }

    public function endLecture(Request $request, Lecture $lecture): JsonResponse
    {
        Gate::authorize('endLecture', $lecture);

        $this->service->endLecture($lecture);

        return $this->successResponse([
            'message' => 'تم إنهاء المحاضرة وتسجيل الغياب للطلاب المتغيبين',
            'lecture' => new LectureResource($lecture->fresh())
        ]);
    }

    public function getAttendees(Request $request, Lecture $lecture): JsonResponse
    {
        Gate::authorize('viewAttendees', $lecture);

        $filters = [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
        ];

        $data = $this->service->getAttendees($lecture, $filters);
        $availableDates = $this->service->getAvailableDates($lecture);

        return $this->successResponse([
            'lecture' => [
                'id' => $lecture->id,
                'title' => $lecture->title,
                'is_recurring' => $lecture->is_recurring,
                'recurrence_days' => $lecture->recurrence_days,
                'group_name' => $lecture->group ? $lecture->group->name : 'كل المجموعات',
            ],
            'attendees' => $data['attendees'],
            'total_present' => $data['total_present'],
            'total_absent' => $data['total_absent'],
            'available_dates' => $availableDates,
        ]);
    }

    public function exportAttendees(Request $request, Lecture $lecture)
    {
        Gate::authorize('exportAttendees', $lecture);

        return $this->exportService->exportAttendeesPdf($lecture);
    }

    public function cancelSession(CancelSessionRequest $request, Lecture $lecture): JsonResponse
    {
        Gate::authorize('cancelSession', $lecture);

        $validated = $request->validated();
        $this->service->cancelSession($lecture, $validated['date']);

        return $this->successResponse([
            'message' => 'تم إلغاء المحاضرة لهذا اليوم وإرسال الإشعارات',
            'lecture' => new LectureResource($lecture->fresh())
        ]);
    }
}
