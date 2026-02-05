<?php

declare(strict_types=1);

namespace App\Services\Student;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamResult;
use App\Models\Question;
use App\Models\Student;
use App\Models\StudentAnswer;
use App\Notifications\ExamResultNotification;
use App\Services\Student\MistakesService;
use App\Services\Infrastructure\PointService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StudentExamService
{
    public function __construct(
        private PointService $pointService,
        private MistakesService $mistakesService
    ) {}

    /**
     * Get exam details
     */
    public function getExamDetails(Exam $exam): \App\DTOs\Student\ExamData
    {
        return \App\DTOs\Student\ExamData::fromArray([
            'id' => $exam->id,
            'title' => $exam->title,
            'subject' => $exam->subject,
            'duration' => $exam->duration,
            'max_score' => $exam->max_score,
            'actual_question_count' => $exam->actual_question_count,
            'time_per_question' => $exam->time_per_question,
            'date' => $exam->date,
            'is_active' => $exam->is_active,
        ]);
    }

    /**
     * Check if student has completed exam
     */
    public function hasStudentCompleted(Student $student, Exam $exam): bool
    {
        return ExamResult::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->exists();
    }

    /**
     * Get student's result for an exam
     */
    public function getStudentResult(Student $student, Exam $exam): ?\App\Models\ExamResult
    {
        return ExamResult::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();
    }

    /**
     * Get student's result for an exam
     */
    public function getStudentResult(Student $student, Exam $exam): ?\App\Models\ExamResult
    {
        return ExamResult::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();
    }

    /**
     * Get exams for a student and teacher
     */
    public function getExams(Student $student, string $teacherId, int $perPage = 10): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Exam::where('teacher_id', $teacherId)
            ->with(['results' => function ($q) use ($student) {
                $q->where('student_id', $student->id);
            }])
            ->orderBy('is_active', 'desc')
            ->latest();

        return $query->paginate($perPage);
    }

    /**
     * Start an exam for a student
     */
    public function startExam(Student $student, Exam $exam): array
    {
        // Check if student already has an attempt
        $existingAttempt = ExamAttempt::where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->first();

        if ($existingAttempt) {
            if ($existingAttempt->status === 'in_progress') {
                // Check if questions still exist (in case exam was edited)
                $questionsCount = Question::whereIn('id', $existingAttempt->questions_order)->count();
                
                if ($questionsCount !== count($existingAttempt->questions_order)) {
                    // Exam was modified, delete invalid attempt and start over
                    \Log::info('Exam Attempt Check', [
                        'attempt_id' => $existingAttempt->id,
                        'questions_order_count' => $questionsCount,
                        'found_questions_count' => count($existingAttempt->questions_order),
                    ]);
                    $existingAttempt->delete();
                    $existingAttempt = null;
                } else {
                    // Return existing attempt
                    return $this->getAttemptData($existingAttempt);
                }
            }
            
            if ($existingAttempt) {
                throw new \Exception('لقد قمت بأداء هذا الامتحان مسبقاً');
            }
        }

        return $this->getAttemptData($existingAttempt);
    }
}
