<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Video\StoreVideoQuizRequest;
use App\Domains\Application\Http\Requests\Teacher\Video\UpdateVideoQuizRequest;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Services\VideoQuizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class VideoQuizController extends Controller
{
    public function __construct(
        private readonly VideoQuizService $quizService,
    ) {}

    /**
     * GET /academy/videos/{video}/quiz
     */
    public function show(Video $video): JsonResponse
    {
        Gate::authorize('update', $video);

        $quiz = $video->quiz()->with('questions')->first();

        return response()->json(['quiz' => $quiz]);
    }

    /**
     * POST /academy/videos/{video}/quiz
     */
    public function store(StoreVideoQuizRequest $request, Video $video): JsonResponse
    {
        Gate::authorize('update', $video);

        // نجلب المدرس المرتبط بالفيديو
        $teacher = $video->teacherReference;
        if (!$teacher) {
            return $this->errorResponse('لا يمكن تحديد المدرس لهذا الفيديو', 422);
        }

        try {
            $quiz = $this->quizService->createQuiz($video, $teacher, $request->validated());
            return response()->json(['quiz' => $quiz], 201);
        } catch (\RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    /**
     * PUT /academy/videos/{video}/quiz
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
     * DELETE /academy/videos/{video}/quiz
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
     * GET /academy/videos/{video}/quiz/results
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

        $totalStudents  = $attempts->pluck('student.id')->unique()->count();
        $passedStudents = $attempts->where('status', 'passed')->pluck('student.id')->unique()->count();

        return $this->successResponse([
            'quiz'    => [
                'id'              => $quiz->id,
                'title'           => $quiz->title,
                'passing_score'   => $quiz->passing_score,
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
