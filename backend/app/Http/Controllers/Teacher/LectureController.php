<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Lecture\StoreLectureRequest;
use App\Http\Requests\Teacher\Lecture\UpdateLectureRequest;
use App\Http\Resources\Teacher\LectureResource;
use App\Models\Lecture;
use App\Services\Teacher\LectureService;
use Illuminate\Http\Request;

class LectureController extends Controller
{
    use \App\Traits\ResolvesTeacher;
    protected $lectureService;

    public function __construct(LectureService $lectureService)
    {
        $this->lectureService = $lectureService;
    }

    public function index(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = $request->input('per_page', 10);
        $filters = $request->only(['search', 'date_from', 'date_to', 'group_id']);
        $lectures = $this->lectureService->getLectures($teacher, $perPage, $filters);
        
        return $this->successResponse(
            LectureResource::collection($lectures)->response()->getData(true)
        );
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'grade_id' => 'required|exists:grades,id',
                'group_id' => 'nullable|exists:groups,id',
                'date' => 'required|date',
            ]);

            $date = \Carbon\Carbon::parse($validated['date']);
            
            $lecture = $this->lectureService->createLecture($this->getTeacherFromRequest($request), [
                'title' => $validated['title'],
                'description' => $validated['description'],
                'grade_id' => $request->input('grade_id'),
                'group_id' => $request->input('group_id'),
                'start_time' => $date->copy()->startOfDay(),
                'end_time' => $date->copy()->addHours(24),
                'is_active' => false,
            ]);

            return $this->successResponse([
                'lecture' => new LectureResource($lecture),
                'message' => 'تم إضافة المحاضرة بنجاح'
            ], 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Lecture creation failed: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function update(UpdateLectureRequest $request, Lecture $lecture)
    {
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $data = $request->validated();

        if (isset($data['date'])) {
            $date = \Carbon\Carbon::parse($data['date']);
            $data['start_time'] = $date->copy()->startOfDay();
            $data['end_time'] = $date->copy()->addHours(24);
            unset($data['date']);
        }

        $lecture = $this->lectureService->updateLecture($lecture, $data);

        return $this->successResponse([
            'lecture' => new LectureResource($lecture),
            'message' => 'تم تحديث المحاضرة بنجاح'
        ]);
    }

    public function destroy(Request $request, Lecture $lecture)
    {
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $this->lectureService->deleteLecture($lecture);

        return $this->successResponse([
            'message' => 'تم حذف المحاضرة بنجاح'
        ]);
    }

    public function toggleActive(Request $request, Lecture $lecture)
    {
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $lecture->update([
            'is_active' => !$lecture->is_active
        ]);

        if ($lecture->is_active) {
            try {
                // Get active students enrolled in this grade
                $students = $lecture->teacher->students()
                    ->wherePivot('grade_id', $lecture->grade_id)
                    ->wherePivot('is_active', true)
                    ->get();

                if ($students->count() > 0) {
                    \Illuminate\Support\Facades\Notification::send(
                        $students, 
                        new \App\Notifications\LectureActivatedNotification(
                            $lecture->title, 
                            $lecture->teacher->name, 
                            $lecture->id
                        )
                    );
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send lecture activation notification: ' . $e->getMessage());
            }
        }

        return $this->successResponse([
            'message' => $lecture->is_active ? 'تم تفعيل المحاضرة' : 'تم إلغاء تفعيل المحاضرة',
            'is_active' => $lecture->is_active
        ]);
    }

    public function endLecture(Request $request, Lecture $lecture)
    {
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        // Allow re-activation of ended lectures (removed the is_active check)
        $this->lectureService->endLecture($lecture);

        return $this->successResponse([
            'message' => 'تم إنهاء المحاضرة وتسجيل الغياب للطلاب المتغيبين',
            'lecture' => new LectureResource($lecture->fresh())
        ]);
    }

    /**
     * Get attendees for a specific lecture
     */
    public function getAttendees(Request $request, Lecture $lecture)
    {
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $attendances = $lecture->attendances()
            ->with('student')
            ->get()
            ->map(function ($attendance) {
                return [
                    'id' => $attendance->id,
                    'student_id' => $attendance->student_id,
                    'student_name' => $attendance->student?->name,
                    'student_phone' => $attendance->student?->phone,
                    'status' => $attendance->status,
                    'attended_at' => $attendance->created_at->format('Y-m-d H:i'),
                ];
            });

        return $this->successResponse([
            'lecture' => [
                'id' => $lecture->id,
                'title' => $lecture->title,
            ],
            'attendees' => $attendances,
            'total_present' => $attendances->where('status', 'present')->count(),
            'total_absent' => $attendances->where('status', 'absent')->count(),
        ]);
    }

    public function exportAttendees(Request $request, Lecture $lecture)
    {
        $attendances = $lecture->attendances()
            ->with('student')
            ->get();

        $data = [
            'lecture' => $lecture,
            'attendees' => $attendances,
            'total_present' => $attendances->where('status', 'present')->count(),
            'total_absent' => $attendances->where('status', 'absent')->count(),
            'date' => now()->format('Y-m-d'),
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('exports.attendees', $data);
        return $pdf->download("attendance_report_{$lecture->id}.pdf");
    }
}
