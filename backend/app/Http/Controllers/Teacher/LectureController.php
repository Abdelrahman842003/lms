<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\DTOs\Teacher\LectureData;
use App\Http\Requests\Teacher\Lecture\CancelSessionRequest;
use App\Http\Requests\Teacher\Lecture\StoreLectureRequest;
use App\Http\Requests\Teacher\Lecture\UpdateLectureRequest;
use App\Http\Resources\Teacher\LectureResource;
use App\Models\Lecture;
use App\Services\Teacher\LectureService;
use App\Traits\ResolvesTeacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Carbon\Carbon;

class LectureController extends Controller
{
    use ResolvesTeacher;
    protected $lectureService;

    public function __construct(LectureService $lectureService)
    {
        $this->lectureService = $lectureService;
    }

    public function index(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        if (!$teacher) {
            return $this->errorResponse('Unauthorized', 403);
        }
        
        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'date_from', 'date_to', 'group_id', 'status']);
        $academyId = $request->header('X-Academy-Id');
        
        $lectures = $this->lectureService->getLectures($teacher, $perPage, $filters, $academyId);
        $lectures->load('current_session');
        
        return $this->successResponse(
            LectureResource::collection($lectures)->response()->getData(true)
        );
    }

    public function store(StoreLectureRequest $request)
    {
        try {
            $teacher = $this->getTeacherFromRequest($request);
            if (!$teacher) {
                return $this->errorResponse('Unauthorized', 403);
            }

            $lectureData = LectureData::fromRequest($request);
            $lecture = $this->lectureService->createLecture($teacher, $lectureData->toArray());

            return $this->successResponse([
                'lecture' => new LectureResource($lecture),
                'message' => 'تم إضافة المحاضرة بنجاح'
            ], 'تم إضافة المحاضرة بنجاح', 201);
        } catch (\Exception $e) {
            Log::error('Lecture creation failed: ' . $e->getMessage());
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
    
    public function show(Request $request, Lecture $lecture)
    {
        $teacher = $this->getTeacherFromRequest($request);
        if (!$teacher || $lecture->teacher_id !== $teacher->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        return $this->successResponse([
            'lecture' => new LectureResource($lecture->load(['grade', 'group']))
        ]);
    }

    public function update(UpdateLectureRequest $request, Lecture $lecture)
    {
        $teacher = $this->getTeacherFromRequest($request);
        if (!$teacher || $lecture->teacher_id !== $teacher->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $data = $request->validated();
        \Illuminate\Support\Facades\Log::info('Update Lecture Data:', $data);

        if (isset($data['date']) && $data['date']) {
            $date = \Carbon\Carbon::parse($data['date']);
            
            if (isset($data['recurrence_time']) && isset($data['duration_minutes'])) {
                // Parse time in Cairo and convert to UTC
                $data['start_time'] = \Carbon\Carbon::parse($date->format('Y-m-d') . ' ' . $data['recurrence_time'], 'Africa/Cairo')
                    ->setTimezone('UTC');
                $data['end_time'] = $data['start_time']->copy()->addMinutes($data['duration_minutes']);
            } else {
                // Full day in Cairo converted to UTC
                $data['start_time'] = $date->copy()->setTimezone('Africa/Cairo')->startOfDay()->setTimezone('UTC');
                $data['end_time'] = $date->copy()->setTimezone('Africa/Cairo')->addHours(24)->setTimezone('UTC');
            }
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
        $teacher = $this->getTeacherFromRequest($request);
        if (!$teacher || $lecture->teacher_id !== $teacher->id) {
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

        // Dispatch event before deletion if the event handler needs the model's data
        $this->lectureService->deleteLecture($lecture);

        return $this->successResponse([
            'message' => 'تم حذف المحاضرة بنجاح'
        ]);
    }

    public function toggleActive(Request $request, Lecture $lecture)
    {
        $teacher = $this->getTeacherFromRequest($request);
        if (!$teacher || $lecture->teacher_id !== $teacher->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $lecture = $this->lectureService->toggleActive($lecture);

        return $this->successResponse([
            'message' => $lecture->is_active ? 'تم تفعيل المحاضرة' : 'تم إلغاء تفعيل المحاضرة',
            'is_active' => $lecture->is_active
        ]);
    }

    public function endLecture(Request $request, Lecture $lecture)
    {
        $teacher = $this->getTeacherFromRequest($request);
        if (!$teacher || $lecture->teacher_id !== $teacher->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        // Allow re-activation of ended lectures (removed the is_active check)
        $this->lectureService->endLecture($lecture);

        \App\Events\LectureUpdated::dispatch($lecture);

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

        $filters = [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
        ];

        $data = $this->lectureService->getAttendees($lecture, $filters);
        $availableDates = $this->lectureService->getAvailableDates($lecture);

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

        $defaultConfig = (new \Mpdf\Config\ConfigVariables())->getDefaults();
        $fontDirs = $defaultConfig['fontDir'];

        $defaultFontConfig = (new \Mpdf\Config\FontVariables())->getDefaults();
        $fontData = $defaultFontConfig['fontdata'];

        $mpdf = new \Mpdf\Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'default_font_size' => 11,
            'default_font' => 'xbriyaz',
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 15,
            'margin_bottom' => 15,
            'tempDir' => storage_path('app/mpdf'),
            'fontDir' => array_merge($fontDirs, [
                base_path('vendor/mpdf/mpdf/ttfonts'),
            ]),
            'fontdata' => $fontData + [
                'xbriyaz' => [
                    'R' => 'XB Riyaz.ttf',
                    'B' => 'XB RiyazBd.ttf',
                    'I' => 'XB RiyazIt.ttf',
                    'BI' => 'XB RiyazBdIt.ttf',
                    'useOTL' => 0xFF,
                    'useKashida' => 75,
                ]
            ],
        ]);

        $mpdf->SetDirectionality('rtl');
        $mpdf->autoScriptToLang = true;
        $mpdf->autoLangToFont = true;

        $html = view('exports.attendees', $data)->render();
        
        $mpdf->WriteHTML($html);
        
        return $mpdf->Output("attendance_report_{$lecture->id}.pdf", 'D');
    }
    public function cancelSession(CancelSessionRequest $request, Lecture $lecture)
    {
        $teacher = $this->getTeacherFromRequest($request);
        if (!$teacher || $lecture->teacher_id !== $teacher->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $validated = $request->validated();
        $this->lectureService->cancelSession($lecture, $validated['date']);

        return $this->successResponse([
            'message' => 'تم إلغاء المحاضرة لهذا اليوم وإرسال الإشعارات',
            'lecture' => new LectureResource($lecture->fresh())
        ]);
    }
}
