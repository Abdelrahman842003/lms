<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Lecture\StoreLectureRequest;
use App\Http\Requests\Teacher\Lecture\UpdateLectureRequest;
use App\Http\Resources\Teacher\LectureResource;
use App\Models\Lecture;
use App\Services\Teacher\LectureService;
use Illuminate\Http\Request;
use Carbon\Carbon;

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
                'date' => 'nullable|date|required_without:is_recurring',
                'is_recurring' => 'boolean',
                'recurrence_days' => 'nullable|array|required_if:is_recurring,true',
                'recurrence_time' => 'nullable|date_format:H:i|required_if:is_recurring,true',
                'duration_minutes' => 'nullable|integer|min:1|required_if:is_recurring,true',
            ]);

            if ($request->boolean('is_recurring')) {
                $lecture = $this->lectureService->createLecture($this->getTeacherFromRequest($request), [
                    'title' => $validated['title'],
                    'description' => $validated['description'],
                    'grade_id' => $request->input('grade_id'),
                    'group_id' => $request->input('group_id'),
                    'is_active' => false,
                    'is_recurring' => true,
                    'recurrence_days' => $request->input('recurrence_days'),
                    'recurrence_time' => $request->input('recurrence_time'),
                    'duration_minutes' => $request->input('duration_minutes'),
                ]);
            } else {
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
            }

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

        if ($lecture->start_time > now() || $lecture->is_active) {
            // Send cancellation notification to enrolled students
            try {
                $students = $lecture->teacher->students()
                    ->wherePivot('grade_id', $lecture->grade_id)
                    ->wherePivot('is_active', true)
                    ->get();

                if ($students->count() > 0) {
                    \Illuminate\Support\Facades\Notification::send(
                        $students, 
                        new \App\Notifications\LectureCancelledNotification(
                            $lecture->title, 
                            $lecture->teacher->name
                        )
                    );

                    // Also notify guardians if needed (assuming relationship exists)
                    // $guardians = ...
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send lecture cancellation notification: ' . $e->getMessage());
            }
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
    /**
     * Get attendees for a specific lecture
     */
    public function getAttendees(Request $request, Lecture $lecture)
    {
        $teacher = $this->getTeacherFromRequest($request);
        
        if (!$teacher || $lecture->teacher_id !== $teacher->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        // Get all active students for this teacher in this grade/group
        $query = $lecture->teacher->students()
            ->wherePivot('grade_id', $lecture->grade_id)
            ->wherePivot('is_active', true);
            
        if ($lecture->group_id) {
            $query->wherePivot('group_id', $lecture->group_id);
        }

        $allStudents = $query->get();

        // Get existing attendance records
        $attendanceQuery = $lecture->attendances();

        if ($request->has('date_from')) {
            $attendanceQuery->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->has('date_to')) {
            $attendanceQuery->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $attendanceRecords = $attendanceQuery->get()->keyBy('student_id');

        $attendees = $allStudents->map(function ($student) use ($attendanceRecords) {
            $record = $attendanceRecords->get($student->id);
            
            return [
                'id' => $record ? $record->id : null,
                'student_id' => $student->id,
                'student_name' => $student->name,
                'student_phone' => $student->phone,
                'status' => $record ? $record->status : 'absent', // Default to absent if no record
                'attended_at' => $record ? $record->created_at->format('Y-m-d H:i:s') : null,
            ];
        });

        // Get available dates logic
        $availableDates = [];
        
        if ($lecture->is_recurring && is_array($lecture->recurrence_days)) {
            $startDate = $lecture->created_at->copy()->startOfDay();
            $endDate = now()->endOfDay();
            
            // Map day names to Carbon integers (Sunday = 0, Monday = 1, etc.)
            $dayMap = [
                'Sunday' => 0,
                'Monday' => 1,
                'Tuesday' => 2,
                'Wednesday' => 3,
                'Thursday' => 4,
                'Friday' => 5,
                'Saturday' => 6,
            ];
            
            $recurrenceDays = array_map(function($day) use ($dayMap) {
                return $dayMap[$day] ?? null;
            }, $lecture->recurrence_days);
            
            $recurrenceDays = array_filter($recurrenceDays, function($day) {
                return $day !== null;
            });

            // Iterate from start date to today
            $current = $startDate->copy();
            while ($current <= $endDate) {
                if (in_array($current->dayOfWeek, $recurrenceDays)) {
                    $dateStr = $current->format('Y-m-d');
                    
                    // Check status
                    $status = 'not_activated';
                    
                    // Check if attendance exists for this date
                    $hasAttendance = $lecture->attendances()
                        ->whereDate('created_at', $dateStr)
                        ->exists();
                        
                    if ($hasAttendance) {
                        $status = 'active';
                    } elseif (in_array($dateStr, $lecture->cancelled_dates ?? [])) {
                        $status = 'cancelled';
                    }
                    
                    $availableDates[] = [
                        'date' => $dateStr,
                        'status' => $status
                    ];
                }
                $current->addDay();
            }
            
            // Sort descending
            usort($availableDates, function($a, $b) {
                return strcmp($b['date'], $a['date']);
            });
            
        } else {
            // For non-recurring, just get dates with attendance
            $dates = $lecture->attendances()
                ->selectRaw('DATE(created_at) as date')
                ->distinct()
                ->orderBy('date', 'desc')
                ->pluck('date');
                
            foreach ($dates as $date) {
                $availableDates[] = [
                    'date' => $date,
                    'status' => 'active'
                ];
            }
        }

        return $this->successResponse([
            'lecture' => [
                'id' => $lecture->id,
                'title' => $lecture->title,
                'is_recurring' => $lecture->is_recurring,
                'recurrence_days' => $lecture->recurrence_days,
                'group_name' => $lecture->group ? $lecture->group->name : 'كل المجموعات',
            ],
            'attendees' => $attendees->values(),
            'total_present' => $attendees->where('status', 'present')->count(),
            'total_absent' => $attendees->where('status', 'absent')->count(),
            'available_dates' => $availableDates,
        ]);
    }

    public function exportAttendees(Request $request, Lecture $lecture)
    {
        // Same logic as getAttendees to ensure consistency
        $query = $lecture->teacher->students()
            ->wherePivot('grade_id', $lecture->grade_id)
            ->wherePivot('is_active', true);
            
        if ($lecture->group_id) {
            $query->wherePivot('group_id', $lecture->group_id);
        }

        $allStudents = $query->get();

        $attendanceRecords = $lecture->attendances()
            ->get()
            ->keyBy('student_id');

        $attendees = $allStudents->map(function ($student) use ($attendanceRecords) {
            $record = $attendanceRecords->get($student->id);
            return (object) [
                'student' => $student,
                'status' => $record ? $record->status : 'absent',
                'created_at' => $record ? $record->created_at : null,
            ];
        });

        $data = [
            'lecture' => $lecture,
            'attendees' => $attendees,
            'total_present' => $attendees->where('status', 'present')->count(),
            'total_absent' => $attendees->where('status', 'absent')->count(),
            'date' => now()->format('Y-m-d'),
        ];

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('exports.attendees', $data);
        // Set paper to A4 and enable UTF-8
        $pdf->setPaper('a4', 'portrait');
        $pdf->setOptions(['defaultFont' => 'dejavu sans']);
        
        return $pdf->download("attendance_report_{$lecture->id}.pdf");
    }
    public function cancelSession(Request $request, Lecture $lecture)
    {
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $request->validate([
            'date' => 'required|date',
        ]);

        $date = $request->input('date');
        $cancelledDates = $lecture->cancelled_dates ?? [];

        if (!in_array($date, $cancelledDates)) {
            $cancelledDates[] = $date;
            $lecture->update(['cancelled_dates' => $cancelledDates]);

            // Notify students
            try {
                $students = $lecture->teacher->students()
                    ->wherePivot('grade_id', $lecture->grade_id)
                    ->wherePivot('is_active', true)
                    ->get();

                if ($students->count() > 0) {
                    \Illuminate\Support\Facades\Notification::send(
                        $students, 
                        new \App\Notifications\LectureCancelledNotification(
                            $lecture->title . ' (' . $date . ')', 
                            $lecture->teacher->name
                        )
                    );
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Failed to send session cancellation notification: ' . $e->getMessage());
            }
        }

        return $this->successResponse([
            'message' => 'تم إلغاء المحاضرة لهذا اليوم وإرسال الإشعارات',
            'lecture' => new LectureResource($lecture->fresh())
        ]);
    }
}
