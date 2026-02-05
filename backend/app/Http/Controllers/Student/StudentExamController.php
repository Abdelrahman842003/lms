<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\GetExamsRequest;
use App\Http\Resources\Student\StudentExamResource;
use App\Services\Student\StudentExamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentExamController extends Controller
{
    public function __construct(
        private StudentExamService $examService
    ) {}

    /**
     * List exams for student
     */
    public function index(GetExamsRequest $request): JsonResponse
    {
        $student = $request->user();
        $teacherId = $request->validated('teacher_id');
        $perPage = (int) $request->input('per_page', 10);

        $exams = $this->examService->getExams($student, $teacherId, $perPage);

        return $this->successResponse(
            StudentExamResource::collection($exams)->response()->getData(true)
        );
    }

    /**
     * Get exam details before starting
     */
    public function show(\App\Models\Exam $exam): JsonResponse
    {
        $student = auth()->user();
        
        $examData = $this->examService->getExamDetails($exam);

        return $this->successResponse([
            'exam' => $examData->toArray(),
            'is_completed' => $this->examService->hasStudentCompleted($student, $exam),
            'result' => $this->examService->getStudentResult($student, $exam),
        ]);
    }

    /**
     * Start an exam
     */
    public function start(\App\Models\Exam $exam): JsonResponse
    {
        if (!$exam->is_active) {
            return $this->errorResponse('هذا الامتحان غير مفعل حالياً', 403);
        }

        try {
            $student = auth()->user();
            $data = $this->examService->startExam($student, $exam);
            
            return $this->successResponse($data, 'تم بدء الامتحان بنجاح');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Submit answer for current question
     */
    public function submitAnswer(Request $request, \App\Models\ExamAttempt $attempt): JsonResponse
    {
        $student = auth()->user();
        $answer = $request->input('answer');

        // Verify this attempt belongs to current user
        if ($attempt->student_id !== $student->id) {
            return $this->errorResponse('غير مصرح', 403);
        }

        try {
            $data = $this->examService->submitAnswer($attempt, $answer);
            return $this->successResponse($data);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Skip current question (time expired)
     */
    public function skipQuestion(\App\Models\ExamAttempt $attempt): JsonResponse
    {
        $student = auth()->user();

        // Verify this attempt belongs to current user
        if ($attempt->student_id !== $student->id) {
            return $this->errorResponse('غير مصرح', 403);
        }

        try {
            $data = $this->examService->skipQuestion($attempt);
            return $this->successResponse($data);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Terminate exam due to violation
     */
    public function terminate(Request $request, \App\Models\ExamAttempt $attempt): JsonResponse
    {
        $reason = $request->input('reason');
        $student = auth()->user();

        // Verify this attempt belongs to current user
        if ($attempt->student_id !== $student->id) {
            return $this->errorResponse('غير مصرح', 403);
        }

        try {
            $data = $this->examService->terminateExam($attempt, $reason);
            return $this->successResponse($data, 'تم إنهاء الامتحان');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Get exam result
     */
    public function result(\App\Models\Exam $exam): JsonResponse
    {
        $student = auth()->user();
        $result = $this->examService->getResult($student, $exam);

        if (!$result) {
            return $this->errorResponse('لم تقم بأداء هذا الامتحان بعد', 404);
        }

        return $this->successResponse($result);
    }

    /**
     * Get current attempt status
     */
    public function attemptStatus(\App\Models\ExamAttempt $attempt): JsonResponse
    {
        $student = auth()->user();

        // Verify this attempt belongs to current user
        if ($attempt->student_id !== $student->id) {
            return $this->errorResponse('غير مصرح', 403);
        }

        $data = $this->examService->getAttemptData($attempt);
        return $this->successResponse($data);
    }
}
