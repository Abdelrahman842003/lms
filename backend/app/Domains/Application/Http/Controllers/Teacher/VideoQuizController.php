<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Video\StoreVideoQuizRequest;
use App\Domains\Application\Http\Requests\Teacher\Video\UpdateVideoQuizRequest;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoQuiz;
use App\Domains\Videos\Services\VideoQuizService;
use App\Domains\Application\Traits\ResolvesTeacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class VideoQuizController extends Controller
{
    use ResolvesTeacher;

    public function __construct(
        private readonly VideoQuizService $quizService,
    ) {}

    /**
     * GET /teacher/videos/{video}/quiz
     * عرض تدريب الفيديو مع أسئلته (للمدرس)
     */
    public function show(Video $video): JsonResponse
    {
        Gate::authorize('update', $video);

        $quiz = $video->quiz()->with('questions')->first();

        return response()->json(['quiz' => $quiz]);
    }

    /**
     * POST /teacher/videos/{video}/quiz
     * إنشاء تدريب جديد للفيديو
     */
    public function store(StoreVideoQuizRequest $request, Video $video): JsonResponse
    {
        Gate::authorize('update', $video);

        $teacher = $this->getTeacherFromRequest($request);

        try {
            $quiz = $this->quizService->createQuiz($video, $teacher, $request->validated());
            return response()->json(['quiz' => $quiz], 201);
        } catch (\RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    /**
     * PUT /teacher/videos/{video}/quiz
     * تعديل التدريب وأسئلته
     */
    public function update(UpdateVideoQuizRequest $request, Video $video): JsonResponse
    {
        Gate::authorize('update', $video);

        $quiz = $video->quiz()->first();
        if (!$quiz) {
            return $this->errorResponse('لا يوجد تدريب لهذا الفيديو', 404);
        }

        $quiz = $this->quizService->updateQuiz($quiz, $request->validated());

        return response()->json(['quiz' => $quiz]);
    }

    /**
     * DELETE /teacher/videos/{video}/quiz
     * حذف التدريب
     */
    public function destroy(Video $video): JsonResponse
    {
        Gate::authorize('update', $video);

        $quiz = $video->quiz()->first();
        if (!$quiz) {
            return $this->errorResponse('لا يوجد تدريب لهذا الفيديو', 404);
        }

        $this->quizService->deleteQuiz($quiz);

        return $this->successResponse(null, 'تم حذف التدريب بنجاح');
    }

    /**
     * GET /teacher/videos/{video}/quiz/results
     * نتائج الطلاب في تدريب هذا الفيديو
     */
    public function results(Video $video): JsonResponse
    {
        Gate::authorize('update', $video);

        $quiz = $video->quiz()->first();
        if (!$quiz) {
            return $this->errorResponse('لا يوجد تدريب لهذا الفيديو', 404);
        }

        $attempts = $quiz->attempts()
            ->with('student:id,name,phone')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($a) => [
                'id'            => $a->id,
                'student'       => $a->student,
                'correct_count' => $a->correct_count,
                'total_count'   => $a->total_count,
                'percentage'    => (float) $a->percentage,
                'status'        => $a->status,
                'completed_at'  => $a->completed_at,
            ]);

        // ملخص
        $totalStudents  = $attempts->pluck('student.id')->unique()->count();
        $passedStudents = $attempts->where('status', 'passed')->pluck('student.id')->unique()->count();

        return $this->successResponse([
            'quiz'    => [
                'id'            => $quiz->id,
                'title'         => $quiz->title,
                'passing_score' => $quiz->passing_score,
                'questions_count' => $quiz->questions()->count(),
            ],
            'summary' => [
                'total_attempts'  => $attempts->count(),
                'total_students'  => $totalStudents,
                'passed_students' => $passedStudents,
                'avg_score'       => $attempts->avg('percentage') ? round($attempts->avg('percentage'), 1) : 0,
            ],
            'attempts' => $attempts,
        ]);
    }
}
