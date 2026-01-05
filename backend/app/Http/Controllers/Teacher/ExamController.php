<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Exam\StoreExamRequest;
use App\Http\Requests\Teacher\Exam\UpdateExamRequest;
use App\Http\Resources\Teacher\ExamResource;
use App\Http\Resources\Teacher\ExamResultDetailResource;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Student;
use App\Notifications\ExamAbsentNotification;
use App\Notifications\ExamActivatedNotification;
use App\Services\Teacher\ExamService;
use App\Traits\ResolvesTeacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class ExamController extends Controller
{
    use ResolvesTeacher;
    protected $examService;

    public function __construct(ExamService $examService)
    {
        $this->examService = $examService;
    }

    public function results(Exam $exam)
    {
        \Illuminate\Support\Facades\Log::info('Results endpoint hit', ['exam_id' => $exam->id]);
        
        try {
            if ($exam->teacher_id !== $this->getTeacherFromRequest(request())->id) {
                return $this->errorResponse('Unauthorized', 403);
            }

            // فقط الطلاب الذين حضروا (لديهم attempt_id)
            $results = $exam->results()
                ->whereNotNull('attempt_id')
                ->with(['student'])
                ->get();

            return $this->successResponse([
                'exam' => [
                    'id' => $exam->id,
                    'title' => $exam->title,
                    'subject' => $exam->subject,
                    'max_score' => $exam->max_score,
                    'date' => $exam->date,
                    'duration' => $exam->duration,
                ],
                'results' => ExamResultDetailResource::collection($results)
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error fetching exam results: ' . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            return $this->errorResponse('An error occurred while fetching results', 500);
        }
    }

    public function index(\Illuminate\Http\Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'date_from', 'date_to']);
        $exams = $this->examService->getExams($this->getTeacherFromRequest(request()), $perPage, $filters);

        return $this->successResponse(
            \App\Http\Resources\Teacher\ExamResource::collection($exams)->response()->getData(true)
        );
    }

    public function store(StoreExamRequest $request)
    {
        try {
            $teacher = $this->getTeacherFromRequest(request());
            $data = $request->validated();
            
            // التحقق من تعارض التواريخ كتحذير مبكر
            $warning = null;
            $dateConflict = $this->examService->checkDateConflicts(
                $data['grade_id'],
                $data['date'],
                $teacher->id
            );
            
            if ($dateConflict) {
                $teacherNames = $dateConflict['conflicting_exams']
                    ->pluck('teacher.name')
                    ->unique()
                    ->implode('، ');
                $warning = "تنبيه: يوجد امتحان في نفس التاريخ للمدرس: {$teacherNames}. قد يؤثر على {$dateConflict['affected_students_count']} طالب مشترك.";
            }
            
            $exam = $this->examService->createExam($teacher, $data);

            $response = [
                'exam' => $exam
            ];
            
            if ($warning) {
                $response['warning'] = $warning;
            }

            return $this->successResponse($response, 'تم إنشاء الامتحان بنجاح', 201);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to create exam: ' . $e->getMessage(), 500);
        }
    }

    public function show(Exam $exam)
    {
        if ($exam->teacher_id !== $this->getTeacherFromRequest(request())->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        return $this->successResponse([
            'exam' => $exam->load(['questions', 'grade', 'group'])
        ]);
    }

    public function update(UpdateExamRequest $request, Exam $exam)
    {
        $teacher = $this->getTeacherFromRequest(request());
        
        if ($exam->teacher_id !== $teacher->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        try {
            $data = $request->validated();
            
            // التحقق من تعارض التواريخ كتحذير مبكر
            $warning = null;
            $dateConflict = $this->examService->checkDateConflicts(
                $data['grade_id'],
                $data['date'],
                $teacher->id,
                $exam->id
            );
            
            if ($dateConflict) {
                $teacherNames = $dateConflict['conflicting_exams']
                    ->pluck('teacher.name')
                    ->unique()
                    ->implode('، ');
                $warning = "تنبيه: يوجد امتحان في نفس التاريخ للمدرس: {$teacherNames}. قد يؤثر على {$dateConflict['affected_students_count']} طالب مشترك.";
            }
            
            $exam = $this->examService->updateExam($exam, $data);

            $response = [
                'exam' => $exam
            ];
            
            if ($warning) {
                $response['warning'] = $warning;
            }

            return $this->successResponse($response, 'تم تحديث الامتحان بنجاح');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to update exam: ' . $e->getMessage(), 500);
        }
    }

    public function destroy(Exam $exam)
    {
        $this->examService->deleteExam($exam);
        return $this->successResponse(null, 'تم حذف الامتحان بنجاح');
    }

    public function copy(Exam $exam)
    {
        if ($exam->teacher_id !== $this->getTeacherFromRequest(request())->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        try {
            $title = request()->input('title');
            $newExam = $this->examService->copyExam($exam, $title);
            return $this->successResponse(['exam' => $newExam], 'تم نسخ الامتحان بنجاح');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to copy exam: ' . $e->getMessage(), 500);
        }
    }

    public function toggleStatus(Exam $exam)
    {
        $result = $this->examService->toggleStatus($exam);

        if (!$result['success']) {
            return $this->errorResponse($result['message'], $result['code'] ?? 400);
        }

        return $this->successResponse(
            new ExamResource($result['exam']),
            $result['message']
        );
    }

    public function endExam(Exam $exam)
    {
        try {
            $exam = $this->examService->endExam($exam);
            
            return $this->successResponse(
                new ExamResource($exam),
                'تم إنهاء الامتحان بنجاح واحتساب النتائج'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }


}
