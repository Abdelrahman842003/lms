<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Question\StoreQuestionRequest;
use App\Domains\Application\Http\Requests\Teacher\Question\UpdateQuestionRequest;
use App\Domains\Exams\Models\Question;
use App\Domains\Exams\Models\Exam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuestionController extends Controller
{
    use \App\Domains\Application\Traits\ResolvesTeacher;

    public function index(Request $request): JsonResponse
    {
        $teacher = $this->getProfileFromRequest($request);
        $academyId = $request->header('X-Academy-Id') ?? $request->input('academy_id');
        
        $query = Question::where('teacher_profile_id', $teacher->id);

        if ($academyId === 'independent') {
            $query->where(function ($q) {
                $q->whereDoesntHave('grade')
                  ->orWhereHas('grade', fn ($g) => $g->whereNull('academy_id'));
            });
        } elseif ($academyId) {
            $query->whereHas('grade', fn ($g) => $g->where('academy_id', $academyId));
        }

        if ($request->has('difficulty')) {
            $query->where('difficulty', $request->input('difficulty'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('grade_id')) {
            $query->where('grade_id', $request->input('grade_id'));
        }

        if ($request->has('subject')) {
            $query->where('subject', $request->input('subject'));
        }

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('text', 'like', "%{$search}%");
        }

        // Check if question is used in active exams to return in response
        $query->withCount(['exams as is_locked' => function ($query) {
            $query->where('is_active', true)
                  ->where(function($q) {
                      $q->whereNull('ended_at')
                        ->orWhere('ended_at', '>', now());
                  });
        }]);

        $questions = $query->latest()->paginate((int) $request->input('per_page', 15));

        return $this->successResponse($questions);
    }

    public function store(StoreQuestionRequest $request): JsonResponse
    {
        $teacher = $this->getProfileFromRequest($request);
        $academyId = $request->header('X-Academy-Id') ?? $request->input('academy_id');
        
        $data = $request->validated();
        $data['teacher_profile_id'] = $teacher->id;

        // Ensure grade belongs to the correct context
        if ($academyId && $academyId !== 'independent') {
            $gradeBelongsToAcademy = \Illuminate\Support\Facades\DB::table('grades')
                ->where('id', $data['grade_id'])
                ->where('academy_id', $academyId)
                ->exists();
            if (!$gradeBelongsToAcademy) {
                return $this->errorResponse('الصف الدراسي المختار لا ينتمي للأكاديمية الحالية', 400);
            }
        } else {
            $gradeIsIndependent = \Illuminate\Support\Facades\DB::table('grades')
                ->where('id', $data['grade_id'])
                ->whereNull('academy_id')
                ->exists();
            if (!$gradeIsIndependent) {
                return $this->errorResponse('الصف الدراسي المختار ليس صفاً مستقلاً', 400);
            }
        }

        $question = Question::create($data);

        return $this->successResponse($question, 'تم إضافة السؤال بنجاح', 201);
    }

    public function show(Request $request, Question $question): JsonResponse
    {
        $teacher = $this->getProfileFromRequest($request);
        if ($question->teacher_profile_id !== $teacher->id) {
            return $this->errorResponse('غير مصرح لك بعرض هذا السؤال', 403);
        }

        $isLocked = $question->exams()
            ->where('is_active', true)
            ->where(function($q) {
                $q->whereNull('ended_at')
                  ->orWhere('ended_at', '>', now());
            })->exists();

        $question->is_locked = $isLocked;

        return $this->successResponse($question);
    }

    public function update(UpdateQuestionRequest $request, Question $question): JsonResponse
    {
        $teacher = $this->getProfileFromRequest($request);
        if ($question->teacher_profile_id !== $teacher->id) {
            return $this->errorResponse('غير مصرح لك بتعديل هذا السؤال', 403);
        }

        // Block update if attached to active or scheduled exams
        $isLocked = $question->exams()
            ->where('is_active', true)
            ->where(function($q) {
                $q->whereNull('ended_at')
                  ->orWhere('ended_at', '>', now());
            })->exists();

        if ($isLocked) {
            return $this->errorResponse('لا يمكن تعديل السؤال لأنه مستخدم في امتحانات نشطة حالياً', 422);
        }

        $question->update($request->validated());

        return $this->successResponse($question, 'تم تحديث السؤال بنجاح');
    }

    public function destroy(Request $request, Question $question): JsonResponse
    {
        $teacher = $this->getProfileFromRequest($request);
        if ($question->teacher_profile_id !== $teacher->id) {
            return $this->errorResponse('غير مصرح لك بحذف هذا السؤال', 403);
        }

        // Block delete if attached to active exams
        $isLocked = $question->exams()
            ->where('is_active', true)
            ->where(function($q) {
                $q->whereNull('ended_at')
                  ->orWhere('ended_at', '>', now());
            })->exists();

        if ($isLocked) {
            return $this->errorResponse('لا يمكن حذف السؤال لأنه مستخدم في امتحانات نشطة', 422);
        }

        $question->delete();

        return $this->successResponse(null, 'تم حذف السؤال بنجاح');
    }
}
