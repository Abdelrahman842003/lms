<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Student\GetExamsRequest;
use App\Domains\Application\Http\Resources\Student\StudentExamResource;
use App\Domains\Application\Services\Student\StudentExamService;
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
    public function show(\App\Domains\Exams\Models\Exam $exam): JsonResponse
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
    public function start(\App\Domains\Exams\Models\Exam $exam): JsonResponse
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
    public function submitAnswer(Request $request, \App\Domains\Exams\Models\ExamAttempt $attempt): JsonResponse
    {
        $student = auth()->user();

        // 1. Defensively validate incoming payload (prevent missing/empty answer)
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'answer' => ['required'], // Can be string or array, but must be present
        ], [
            'answer.required' => 'الرجاء اختيار إجابة قبل المتابعة.'
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors(), 'بيانات غير صالحة');
        }

        $answer = $request->input('answer');

        // Example of safely handling a composite ID if sent from frontend (e.g., question_id:answer)
        if (is_string($answer) && str_contains($answer, ':')) {
            $parts = explode(':', $answer);
            // Safely access index [1] using isset to prevent "Undefined array key 1"
            $answer = isset($parts[1]) ? trim($parts[1]) : trim($parts[0]);
        }

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
    public function skipQuestion(\App\Domains\Exams\Models\ExamAttempt $attempt): JsonResponse
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
    public function terminate(Request $request, \App\Domains\Exams\Models\ExamAttempt $attempt): JsonResponse
    {
        $student = auth()->user();

        // Defensively validate termination reason
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'reason' => ['nullable', 'string', 'max:255']
        ]);

        if ($validator->fails()) {
            return $this->validationError($validator->errors(), 'بيانات غير صالحة');
        }

        $reason = $request->input('reason');

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
    public function result(Request $request, \App\Domains\Exams\Models\Exam $exam): JsonResponse
    {
        $student = auth()->user();
        $attemptId = $request->query('attempt_id');
        $result = $this->examService->getResult($student, $exam, $attemptId);

        if (!$result) {
            return $this->errorResponse('لم تقم بأداء هذا الامتحان بعد', 404);
        }

        return $this->successResponse($result);
    }

    /**
     * Get current attempt status
     */
    public function attemptStatus(\App\Domains\Exams\Models\ExamAttempt $attempt): JsonResponse
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
