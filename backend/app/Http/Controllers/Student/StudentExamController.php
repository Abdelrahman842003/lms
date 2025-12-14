<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Services\Student\StudentExamService;
use Illuminate\Http\Request;

class StudentExamController extends Controller
{
    protected $examService;

    public function __construct(StudentExamService $examService)
    {
        $this->examService = $examService;
    }

    /**
     * List exams for the student
     */
    public function index(Request $request)
    {
        $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
        ]);

        $exams = Exam::where('teacher_id', $request->teacher_id)
            ->with(['results' => function ($q) use ($request) {
                $q->where('student_id', $request->user()->id);
            }])
            ->orderBy('is_active', 'desc')
            ->latest()
            ->paginate(10);

        // Transform collection
        $exams->getCollection()->transform(function ($exam) {
            $result = $exam->results->first();
            $exam->student_score = $result ? $result->score : null;
            $exam->student_percentage = $result ? $result->percentage : null;
            $exam->is_completed = !!$result;
            unset($exam->results);
            return $exam;
        });

        return $this->successResponse($exams);
    }

    /**
     * Get exam details before starting
     */
    public function show(Exam $exam)
    {
        $student = auth()->user();
        
        // Check if student already completed this exam
        $result = $exam->results()->where('student_id', $student->id)->first();
        
        return $this->successResponse([
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'subject' => $exam->subject,
                'duration' => $exam->duration,
                'max_score' => $exam->max_score,
                'actual_question_count' => $exam->actual_question_count,
                'time_per_question' => $exam->time_per_question,
                'date' => $exam->date,
                'is_active' => $exam->is_active,
            ],
            'is_completed' => !!$result,
            'result' => $result ? [
                'score' => $result->score,
                'percentage' => $result->percentage,
            ] : null,
        ]);
    }

    /**
     * Start an exam
     */
    public function start(Exam $exam)
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
    public function submitAnswer(Request $request, ExamAttempt $attempt)
    {
        $request->validate([
            'answer' => 'required|string',
        ]);

        // Verify this attempt belongs to the current user
        if ($attempt->student_id !== auth()->id()) {
            return $this->errorResponse('غير مصرح', 403);
        }

        try {
            $data = $this->examService->submitAnswer($attempt, $request->answer);
            return $this->successResponse($data);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Skip current question (time expired)
     */
    public function skipQuestion(ExamAttempt $attempt)
    {
        // Verify this attempt belongs to the current user
        if ($attempt->student_id !== auth()->id()) {
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
    public function terminate(Request $request, ExamAttempt $attempt)
    {
        $request->validate([
            'reason' => 'required|string|in:visibility_change,screen_resize,manual',
        ]);

        // Verify this attempt belongs to the current user
        if ($attempt->student_id !== auth()->id()) {
            return $this->errorResponse('غير مصرح', 403);
        }

        try {
            $data = $this->examService->terminateExam($attempt, $request->reason);
            return $this->successResponse($data, 'تم إنهاء الامتحان');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Get exam result
     */
    public function result(Exam $exam)
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
    public function attemptStatus(ExamAttempt $attempt)
    {
        // Verify this attempt belongs to the current user
        if ($attempt->student_id !== auth()->id()) {
            return $this->errorResponse('غير مصرح', 403);
        }

        $data = $this->examService->getAttemptData($attempt);
        return $this->successResponse($data);
    }
}
