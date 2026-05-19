<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\Question\StoreAcademyQuestionRequest;
use App\Domains\Application\Http\Requests\Academy\Question\UpdateAcademyQuestionRequest;
use App\Domains\Exams\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    use \App\Domains\Application\Traits\ResolvesAcademy;

    public function index(Request $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        // Get IDs of teachers belonging to this academy
        $teacherIds = $academy->teachers()->pluck('teachers.id')->toArray();
        
        $query = Question::whereIn('teacher_id', $teacherIds);

        if ($request->has('teacher_id')) {
            $query->where('teacher_id', $request->input('teacher_id'));
        }

        if ($request->has('grade_id')) {
            $query->where('grade_id', $request->input('grade_id'));
        }

        if ($request->has('difficulty')) {
            $query->where('difficulty', $request->input('difficulty'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
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

        $questions = $query->with('teacher:id,name')->latest()->paginate((int) $request->input('per_page', 15));

        return $this->successResponse($questions);
    }

    public function store(StoreAcademyQuestionRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $data = $request->validated();
        
        // Ensure teacher belongs to academy
        if (!$academy->teachers()->where('teachers.id', $data['teacher_id'])->exists()) {
            return $this->errorResponse('المدرس المختار لا ينتمي لهذه الأكاديمية', 403);
        }

        $question = Question::create($data);

        return $this->successResponse($question, 'تم إضافة السؤال بنجاح', 201);
    }

    public function show(Request $request, Question $question): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        // Ensure teacher belongs to academy
        if (!$academy->teachers()->where('teachers.id', $question->teacher_id)->exists()) {
            return $this->errorResponse('غير مصرح لك بعرض هذا السؤال', 403);
        }

        $isLocked = $question->exams()
            ->where('is_active', true)
            ->where(function($q) {
                $q->whereNull('ended_at')
                  ->orWhere('ended_at', '>', now());
            })->exists();

        $question->is_locked = $isLocked;
        $question->load('teacher:id,name');

        return $this->successResponse($question);
    }

    public function update(UpdateAcademyQuestionRequest $request, Question $question): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        // Ensure current question's teacher belongs to academy
        if (!$academy->teachers()->where('teachers.id', $question->teacher_id)->exists()) {
            return $this->errorResponse('غير مصرح لك بتعديل هذا السؤال', 403);
        }

        $data = $request->validated();

        // If updating teacher_id, ensure new teacher also belongs to academy
        if (isset($data['teacher_id']) && !$academy->teachers()->where('teachers.id', $data['teacher_id'])->exists()) {
            return $this->errorResponse('المدرس الجديد المختار لا ينتمي لهذه الأكاديمية', 403);
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

        $question->update($data);

        return $this->successResponse($question, 'تم تحديث السؤال بنجاح');
    }

    public function destroy(Request $request, Question $question): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        // Ensure teacher belongs to academy
        if (!$academy->teachers()->where('teachers.id', $question->teacher_id)->exists()) {
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
