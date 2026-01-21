<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\DTOs\Teacher\LectureData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Lecture\CancelSessionRequest;
use App\Http\Requests\Teacher\Lecture\StoreLectureRequest;
use App\Http\Requests\Teacher\Lecture\UpdateLectureRequest;
use App\Http\Resources\Teacher\LectureResource;
use App\Models\Lecture;
use App\Services\Teacher\LectureService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LectureController extends Controller
{
    use \App\Traits\ResolvesTeacher;

    public function __construct(
        private LectureService $service
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
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        return $this->successResponse([
            'lecture' => new LectureResource($lecture->load(['grade', 'group']))
        ]);
    }

    public function update(UpdateLectureRequest $request, Lecture $lecture): JsonResponse
    {
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $lectureData = LectureData::fromRequest($request);
        $lecture = $this->service->updateLecture($lecture, $lectureData->toArray());
        
        return $this->successResponse([
            'lecture' => new LectureResource($lecture),
            'message' => 'تم تحديث المحاضرة بنجاح'
        ]);
    }

    public function destroy(Request $request, Lecture $lecture): JsonResponse
    {
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $this->service->deleteLecture($lecture);

        return $this->successResponse([
            'message' => 'تم حذف المحاضرة بنجاح'
        ]);
    }

    public function toggleActive(Request $request, Lecture $lecture): JsonResponse
    {
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $lecture = $this->service->toggleActive($lecture);

        return $this->successResponse([
            'message' => $lecture->is_active ? 'تم تفعيل المحاضرة' : 'تم إلغاء تفعيل المحاضرة',
            'is_active' => $lecture->is_active
        ]);
    }

    public function endLecture(Request $request, Lecture $lecture): JsonResponse
    {
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $this->service->endLecture($lecture);

        return $this->successResponse([
            'message' => 'تم إنهاء المحاضرة وتسجيل الغياب للطلاب المتغيبين',
            'lecture' => new LectureResource($lecture->fresh())
        ]);
    }

    public function getAttendees(Request $request, Lecture $lecture): JsonResponse
    {
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

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
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            abort(403, 'Unauthorized');
        }

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

    public function cancelSession(CancelSessionRequest $request, Lecture $lecture): JsonResponse
    {
        if ($lecture->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $validated = $request->validated();
        $this->service->cancelSession($lecture, $validated['date']);

        return $this->successResponse([
            'message' => 'تم إلغاء المحاضرة لهذا اليوم وإرسال الإشعارات',
            'lecture' => new LectureResource($lecture->fresh())
        ]);
    }
}
