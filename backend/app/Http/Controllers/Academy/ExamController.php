<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Http\Resources\Teacher\ExamResource;
use App\Models\Exam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    use \App\Traits\ResolvesAcademy;

    public function __construct(
        private \App\Services\Teacher\ExamService $service
    ) {}
    use \App\Traits\ResolvesAcademy;

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

    public function store(\App\Http\Requests\Teacher\Exam\StoreExamRequest $request): JsonResponse
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
            $data = \App\DTOs\Teacher\ExamData::fromRequest($request);
            
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
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search');
        $teacherId = $request->input('teacher_id');
        $status = $request->input('status');

        $query = Exam::query()
            ->with(['teacher', 'grade', 'group'])
            ->where('academy_id', auth()->user()->id);

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

    public function show(Exam $exam): JsonResponse
    {
        // Ensure exam belongs to a teacher in this academy
        $hasAccess = $exam->teacher->academies()
            ->where('academies.id', auth()->user()->id)
            ->exists();

        if (!$hasAccess) {
            return $this->errorResponse('Unauthorized', 403);
        }

        return $this->successResponse([
            'exam' => $exam->load(['questions', 'grade', 'group', 'teacher'])
        ]);
    }

    public function destroy(Exam $exam): JsonResponse
    {
        $hasAccess = $exam->teacher->academies()
            ->where('academies.id', auth()->user()->id)
            ->exists();

        if (!$hasAccess) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $exam->delete();
        return $this->successResponse(null, 'تم حذف الامتحان بنجاح');
    }

    public function toggleStatus(Exam $exam): JsonResponse
    {
        $hasAccess = $exam->teacher->academies()
            ->where('academies.id', auth()->user()->id)
            ->exists();

        if (!$hasAccess) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $exam->update(['is_active' => !$exam->is_active]);
        
        return $this->successResponse(
            new ExamResource($exam),
            $exam->is_active ? 'تم تفعيل الامتحان' : 'تم إلغاء تفعيل الامتحان'
        );
    }

    public function endExam(Exam $exam): JsonResponse
    {
        $hasAccess = $exam->teacher->academies()
            ->where('academies.id', auth()->user()->id)
            ->exists();

        if (!$hasAccess) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $exam->update([
            'is_active' => false,
            'ended_at' => now()
        ]);

        return $this->successResponse(
            new ExamResource($exam),
            'تم إنهاء الامتحان بنجاح'
        );
    }

    public function copy(Exam $exam): JsonResponse
    {
        $hasAccess = $exam->teacher->academies()
            ->where('academies.id', auth()->user()->id)
            ->exists();

        if (!$hasAccess) {
            return $this->errorResponse('Unauthorized', 403);
        }

        try {
            $title = request()->input('title');
            $newExam = $this->service->copyExam($exam, $title);
            
            // Ensure the new exam belongs to the academy
            $newExam->update(['academy_id' => auth()->user()->id]);
            
            return $this->successResponse(['exam' => $newExam], 'تم نسخ الامتحان بنجاح');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to copy exam: ' . $e->getMessage(), 500);
        }
    }
}
