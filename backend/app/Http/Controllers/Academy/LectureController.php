<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Http\Resources\Teacher\LectureResource;
use App\Models\Lecture;
use App\Models\Teacher;
use App\Services\Teacher\LectureService;
use App\Traits\ResolvesAcademy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class LectureController extends Controller
{
    use ResolvesAcademy;
    
    protected $lectureService;

    public function __construct(LectureService $lectureService)
    {
        $this->lectureService = $lectureService;
    }

    /**
     * List all lectures for the academy (both created by academy and by academy's teachers)
     */
    public function index(Request $request)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'date_from', 'date_to', 'group_id', 'status', 'teacher_id']);
        
        // Get lectures: academy's own OR from academy's teachers
        $query = Lecture::with(['teacher', 'grade', 'group', 'current_session'])
            ->where(function ($q) use ($academy) {
                // Lectures created by academy
                $q->where('academy_id', $academy->id)
                // OR lectures from teachers belonging to this academy
                  ->orWhereHas('teacher', function ($tq) use ($academy) {
                      $tq->whereHas('academies', function ($aq) use ($academy) {
                          $aq->where('academies.id', $academy->id)->where('academy_teacher.is_active', true);
                      });
                  });
            })
            ->filter($filters)
            ->orderBy('created_at', 'desc');
        
        $lectures = $query->paginate($perPage);

        return $this->successResponse(
            LectureResource::collection($lectures)->response()->getData(true)
        );
    }

    /**
     * Create a new lecture for the academy
     */
    public function store(Request $request)
    {
        try {
            $academy = $this->getAcademy($request);
            if (!$academy) {
                return $this->errorResponse('Unauthorized', 403);
            }

            $validated = $request->validate([
                'teacher_id' => 'required|uuid|exists:teachers,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'grade_id' => 'required|uuid|exists:grades,id',
                'group_id' => 'nullable|uuid|exists:groups,id',
                'date' => 'required_without:is_recurring|date',
                'is_recurring' => 'boolean',
                'recurrence_days' => 'required_if:is_recurring,true|array',
                'recurrence_time' => 'required|date_format:H:i',
                'duration_minutes' => 'required|integer|min:15|max:480',
            ]);

            // Verify teacher belongs to this academy
            $teacher = Teacher::find($validated['teacher_id']);
            $belongsToAcademy = $teacher->academies()
                ->where('academies.id', $academy->id)
                ->where('academy_teacher.is_active', true)
                ->exists();

            if (!$belongsToAcademy) {
                return $this->errorResponse('المدرس لا ينتمي لهذه الأكاديمية', 400);
            }

            // Process dates
            if (isset($validated['date']) && $validated['date']) {
                $date = Carbon::parse($validated['date']);
                $validated['start_time'] = Carbon::parse($date->format('Y-m-d') . ' ' . $validated['recurrence_time'], 'Africa/Cairo')
                    ->setTimezone('UTC');
                $validated['end_time'] = $validated['start_time']->copy()->addMinutes($validated['duration_minutes']);
            }

            $validated['academy_id'] = $academy->id;

            $lecture = Lecture::create($validated);
            $lecture->load(['teacher', 'grade', 'group']);

            return $this->successResponse([
                'lecture' => new LectureResource($lecture),
                'message' => 'تم إضافة المحاضرة بنجاح'
            ], 'تم إضافة المحاضرة بنجاح', 201);
        } catch (\Exception $e) {
            Log::error('Academy Lecture creation failed: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    /**
     * Show a specific lecture
     */
    public function show(Request $request, Lecture $lecture)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        // Check ownership
        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        return $this->successResponse([
            'lecture' => new LectureResource($lecture->load(['grade', 'group', 'teacher']))
        ]);
    }

    /**
     * Update a lecture
     */
    public function update(Request $request, Lecture $lecture)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $validated = $request->validate([
            'teacher_id' => 'sometimes|uuid|exists:teachers,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'grade_id' => 'sometimes|uuid|exists:grades,id',
            'group_id' => 'nullable|uuid|exists:groups,id',
            'date' => 'sometimes|date',
            'is_recurring' => 'boolean',
            'recurrence_days' => 'array',
            'recurrence_time' => 'sometimes|date_format:H:i',
            'duration_minutes' => 'sometimes|integer|min:15|max:480',
        ]);

        if (isset($validated['date']) && $validated['date']) {
            $date = Carbon::parse($validated['date']);
            if (isset($validated['recurrence_time']) && isset($validated['duration_minutes'])) {
                $validated['start_time'] = Carbon::parse($date->format('Y-m-d') . ' ' . $validated['recurrence_time'], 'Africa/Cairo')
                    ->setTimezone('UTC');
                $validated['end_time'] = $validated['start_time']->copy()->addMinutes($validated['duration_minutes']);
            }
            unset($validated['date']);
        }

        $lecture->update($validated);

        return $this->successResponse([
            'lecture' => new LectureResource($lecture->fresh(['teacher', 'grade', 'group'])),
            'message' => 'تم تحديث المحاضرة بنجاح'
        ]);
    }

    /**
     * Delete a lecture
     */
    public function destroy(Request $request, Lecture $lecture)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $lecture->delete();

        return $this->successResponse([
            'message' => 'تم حذف المحاضرة بنجاح'
        ]);
    }

    /**
     * Toggle lecture active status
     */
    public function toggleActive(Request $request, Lecture $lecture)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $lecture = $this->lectureService->toggleActive($lecture);

        return $this->successResponse([
            'message' => $lecture->is_active ? 'تم تفعيل المحاضرة' : 'تم إلغاء تفعيل المحاضرة',
            'is_active' => $lecture->is_active
        ]);
    }

    /**
     * End a lecture
     */
    public function endLecture(Request $request, Lecture $lecture)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $this->lectureService->endLecture($lecture);

        return $this->successResponse([
            'message' => 'تم إنهاء المحاضرة',
            'lecture' => new LectureResource($lecture->fresh())
        ]);
    }

    /**
     * Generate QR code for a lecture
     */
    public function generateQrCode(Request $request, Lecture $lecture)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessLecture($academy, $lecture)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $qrData = $this->lectureService->generateQrCode($lecture);

        return $this->successResponse($qrData);
    }

    /**
     * Get attendees for a lecture
     */
    public function getAttendees(Request $request, Lecture $lecture)
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

        $data = $this->lectureService->getAttendees($lecture, $filters);

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

    /**
     * Get academy's teachers for lecture creation
     */
    public function getTeachers(Request $request)
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $teachers = $academy->teachers()
            ->wherePivot('is_active', true)
            ->select('teachers.id', 'teachers.name', 'teachers.phone')
            ->get();

        return $this->successResponse([
            'teachers' => $teachers
        ]);
    }

    /**
     * Check if academy can access this lecture
     */
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
