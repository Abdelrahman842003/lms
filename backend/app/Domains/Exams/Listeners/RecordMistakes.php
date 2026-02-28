<?php

declare(strict_types=1);

namespace App\Domains\Exams\Listeners;

use App\Domains\Exams\Events\ExamCompleted;
use App\Domains\Exams\Models\FailedQuestion;
use App\Domains\Exams\Models\StudentAnswer;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * يستمع لـ ExamCompleted ويُسجّل الأسئلة التي أخطأ فيها الطالب.
 * يزيد times_failed إذا كان الخطأ متكرراً.
 */
class RecordMistakes implements ShouldQueue
{

    public function handle(ExamCompleted $event): void
    {
        $attempt   = $event->attempt;
        $studentId = (int) $attempt->student_id;
        $examId    = $attempt->exam_id;

        // جلب الإجابات الخاطئة فقط
        $wrongAnswers = StudentAnswer::where('exam_attempt_id', $attempt->id)
            ->where('is_correct', false)
            ->with('question')
            ->get();

        // جلب teacher_id من الامتحان
        $teacherId = $attempt->exam?->teacher_id;

        foreach ($wrongAnswers as $answer) {
            $question = $answer->question;

            if (! $question) {
                continue;
            }

            // upsert: نزيد times_failed إذا كان موجوداً
            $failed = FailedQuestion::where('student_id', $studentId)
                ->where('question_id', $question->id)
                ->first();

            if ($failed) {
                $failed->increment('times_failed');
                $failed->update(['student_answer' => $answer->answer]);
            } else {
                FailedQuestion::create([
                    'student_id'     => $studentId,
                    'teacher_id'     => $teacherId,
                    'question_id'    => $question->id,
                    'exam_id'        => $examId,
                    'student_answer' => $answer->answer,
                    'times_failed'   => 1,
                    'is_mastered'    => false,
                ]);
            }
        }
    }
}
