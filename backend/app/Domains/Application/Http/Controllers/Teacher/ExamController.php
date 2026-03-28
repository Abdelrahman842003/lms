<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Exams\DTOs\TeacherExamData;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Exam\StoreExamRequest;
use App\Domains\Application\Http\Requests\Teacher\Exam\UpdateExamRequest;
use App\Domains\Application\Http\Resources\Teacher\ExamResource;
use App\Domains\Application\Http\Resources\Teacher\ExamResultDetailResource;
use App\Domains\Exams\Models\Exam;
use App\Domains\Application\Services\Teacher\ExamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class ExamController extends Controller
{
    use \App\Domains\Application\Traits\ResolvesTeacher;

    public function __construct(
        private ExamService $service
    ) {}

    public function results(Exam $exam): JsonResponse
    {
        Log::info('Results endpoint hit', ['exam_id' => $exam->id]);
        
        try {
            Gate::authorize('viewResults', $exam);

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
            Log::error('Error fetching exam results: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return $this->errorResponse('An error occurred while fetching results', 500);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'date_from', 'date_to']);
        $academyId = $request->header('X-Academy-Id') ?? $request->input('academy_id');
        
        $exams = $this->service->getExams($this->getTeacherFromRequest($request), $perPage, $filters, $academyId);

        return $this->successResponse(
            ExamResource::collection($exams)->response()->getData(true)
        );
    }

    public function store(StoreExamRequest $request): JsonResponse
    {
        try {
            $teacher = $this->getTeacherFromRequest($request);
            $data = TeacherExamData::fromRequest($request);
            
            // التحقق من تعارض التواريخ كتحذير مبكر
            $warning = null;
            $dateConflict = $this->service->checkDateConflicts(
                $data->grade_id,
                $data->date,
                $teacher->id
            );
            
            if ($dateConflict) {
                $teacherNames = $dateConflict['conflicting_exams']
                    ->pluck('teacher.name')
                    ->unique()
                    ->implode('، ');
                $warning = "تنبيه: يوجد امتحان في نفس التاريخ للمدرس: {$teacherNames}. قد يؤثر على {$dateConflict['affected_students_count']} طالب مشترك.";
            }
            
            $exam = $this->service->createExam($teacher, $data);

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

    public function show(Exam $exam): JsonResponse
    {
        Gate::authorize('view', $exam);

        return $this->successResponse([
            'exam' => $exam->load(['questions', 'grade', 'group'])
        ]);
    }

    public function update(UpdateExamRequest $request, Exam $exam): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        
        Gate::authorize('update', $exam);

        try {
            $data = ExamData::fromRequest($request);
            
            // التحقق من تعارض التواريخ كتحذير مبكر
            $warning = null;
            $dateConflict = $this->service->checkDateConflicts(
                $data->grade_id,
                $data->date,
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
            
            $exam = $this->service->updateExam($exam, $data);

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

    public function destroy(Exam $exam): JsonResponse
    {
        $this->service->deleteExam($exam);
        return $this->successResponse(null, 'تم حذف الامتحان بنجاح');
    }

    public function copy(Exam $exam): JsonResponse
    {
        Gate::authorize('copy', $exam);

        try {
            $title = request()->input('title');
            $newExam = $this->service->copyExam($exam, $title);
            return $this->successResponse(['exam' => $newExam], 'تم نسخ الامتحان بنجاح');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to copy exam: ' . $e->getMessage(), 500);
        }
    }

    public function toggleStatus(Exam $exam): JsonResponse
    {
        $result = $this->service->toggleStatus($exam);

        if (!$result['success']) {
            return $this->errorResponse($result['message'], $result['code'] ?? 400);
        }

        return $this->successResponse(
            new ExamResource($result['exam']),
            $result['message']
        );
    }

    public function endExam(Exam $exam): JsonResponse
    {
        try {
            $exam = $this->service->endExam($exam);
            
            return $this->successResponse(
                new ExamResource($exam),
                'تم إنهاء الامتحان بنجاح واحتساب النتائج'
            );
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
