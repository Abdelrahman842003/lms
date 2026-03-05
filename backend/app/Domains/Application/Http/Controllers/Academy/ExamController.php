<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Exam\StoreExamRequest;
use App\Domains\Application\Http\Requests\Teacher\Exam\UpdateExamRequest;
use App\Domains\Application\Http\Resources\Teacher\ExamResultDetailResource;
use App\Domains\Application\Http\Resources\Teacher\ExamResource;
use App\Domains\Exams\DTOs\TeacherExamData;
use App\Domains\Exams\Models\Exam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    use \App\Domains\Support\Traits\ResolvesAcademy;

    public function __construct(
        private \App\Domains\Application\Services\Teacher\ExamService $service
    ) {}

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

    public function store(StoreExamRequest $request): JsonResponse
    {
        try {
            $academy = $this->getAcademy($request);
            if (!$academy) {
                return $this->errorResponse('Unauthorized', 403);
            }

            // Manually fetch teacher model since resolving from request might look for authenticated teacher
            $teacherId = $request->input('teacher_id');
            $teacher = $academy->teachers()->find($teacherId);

            if (!$teacher) {
                return $this->errorResponse('Teacher not found in this academy', 404);
            }

            $request->merge(['academy_id_override' => $academy->id]);
            $data = TeacherExamData::fromRequest($request);
            
            // Check for date conflicts
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
                'exam' => new ExamResource($exam)
            ];
            
            if ($warning) {
                $response['warning'] = $warning;
            }

            return $this->successResponse($response, 'تم إنشاء الامتحان بنجاح', 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Exam creation failed: ' . $e->getMessage());
            return $this->errorResponse('Failed to create exam: ' . $e->getMessage(), 500);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search');
        $teacherId = $request->input('teacher_id');
        $status = $request->input('status');

        $query = Exam::query()
            ->with(['teacher', 'grade', 'group'])
            ->where('academy_id', $academy->id);

        if ($search) {
            $query->where('title', 'like', "%{$search}%");
        }

        if ($teacherId) {
            $query->where('teacher_id', $teacherId);
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'upcoming') {
            $query->where('is_active', false)
                  ->whereNull('ended_at')
                  ->where('date', '>', now());
        } elseif ($status === 'ended') {
            $query->whereNotNull('ended_at');
        }

        $exams = $query->latest()->paginate($perPage);

        return $this->successResponse(
            ExamResource::collection($exams)->response()->getData(true)
        );
    }

    public function show(Request $request, Exam $exam): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessExamInAcademy($exam, (string) $academy->id)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        return $this->successResponse([
            'exam' => $exam->load(['questions', 'grade', 'group', 'teacher'])
        ]);
    }

    public function update(UpdateExamRequest $request, Exam $exam): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessExamInAcademy($exam, (string) $academy->id)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        try {
            $request->merge(['academy_id_override' => $academy->id]);
            $data = TeacherExamData::fromRequest($request);

            $warning = null;
            $dateConflict = $this->service->checkDateConflicts(
                $data->grade_id,
                $data->date,
                $exam->teacher_id,
                $exam->id
            );

            if ($dateConflict) {
                $teacherNames = $dateConflict['conflicting_exams']
                    ->pluck('teacher.name')
                    ->unique()
                    ->implode('، ');
                $warning = "تنبيه: يوجد امتحان في نفس التاريخ للمدرس: {$teacherNames}. قد يؤثر على {$dateConflict['affected_students_count']} طالب مشترك.";
            }

            $updatedExam = $this->service->updateExam($exam, $data);

            $response = [
                'exam' => new ExamResource($updatedExam->load(['questions', 'grade', 'group', 'teacher']))
            ];

            if ($warning) {
                $response['warning'] = $warning;
            }

            return $this->successResponse($response, 'تم تحديث الامتحان بنجاح');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Exam update failed: ' . $e->getMessage());
            return $this->errorResponse('Failed to update exam: ' . $e->getMessage(), 500);
        }
    }

    public function destroy(Request $request, Exam $exam): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessExamInAcademy($exam, (string) $academy->id)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $this->service->deleteExam($exam);
        return $this->successResponse(null, 'تم حذف الامتحان بنجاح');
    }

    public function toggleStatus(Request $request, Exam $exam): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessExamInAcademy($exam, (string) $academy->id)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $result = $this->service->toggleStatus($exam);

        if (!$result['success']) {
            return $this->errorResponse($result['message'], $result['code'] ?? 400);
        }

        return $this->successResponse(
            new ExamResource($result['exam']),
            $result['message']
        );
    }

    public function endExam(Request $request, Exam $exam): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessExamInAcademy($exam, (string) $academy->id)) {
            return $this->errorResponse('Unauthorized', 403);
        }

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

    public function copy(Request $request, Exam $exam): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessExamInAcademy($exam, (string) $academy->id)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        try {
            $title = request()->input('title');
            $newExam = $this->service->copyExam($exam, $title);

            // Ensure copied exam remains scoped to current academy
            $newExam->update(['academy_id' => $academy->id]);

            return $this->successResponse(['exam' => $newExam], 'تم نسخ الامتحان بنجاح');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to copy exam: ' . $e->getMessage(), 500);
        }
    }

    public function results(Request $request, Exam $exam): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        if (!$this->canAccessExamInAcademy($exam, (string) $academy->id)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        try {
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
            \Illuminate\Support\Facades\Log::error('Error fetching academy exam results: ' . $e->getMessage());
            return $this->errorResponse('An error occurred while fetching results', 500);
        }
    }

    private function canAccessExamInAcademy(Exam $exam, string $academyId): bool
    {
        if ((string) $exam->academy_id === $academyId) {
            return true;
        }

        // Legacy fallback: allow old academy-scoped records that were saved without academy_id.
        if ($exam->academy_id === null) {
            return ((string) optional($exam->grade)->academy_id === $academyId)
                || ((string) optional($exam->group)->academy_id === $academyId);
        }

        return false;
    }
}
