<?php

declare(strict_types=1);

namespace App\Domains\Exams\Listeners;

use App\Domains\Exams\Events\ExamCompleted;
use App\Domains\Gamification\Models\PointTransaction;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * يستمع لـ ExamCompleted ويمنح الطالب XP بناءً على أداءه.
 *
 * يفوّض العملية لـ GrantXpAction (Phase 9 – Gamification).
 * حالياً placeholder حتى يكتمل تنفيذ Gamification Domain.
 */
class GrantExamXp implements ShouldQueue
{

    public function handle(ExamCompleted $event): void
    {
        $attempt    = $event->attempt;
        $studentId  = $attempt->student_id;
        $percentage = $event->percentage;
        $teacherId  = $attempt->exam->teacher_id;

        // تفويض عملية الحساب والمنح لـ GrantXpAction باستخدام الـ Strategy المناسبة
        try {
            app(\App\Domains\Gamification\Actions\GrantXpAction::class)->execute(
                studentId: (string) $studentId,
                teacherId: (string) $teacherId,
                strategy: new \App\Domains\Gamification\Strategies\ExamXpCalculator(),
                context: ['percentage' => $percentage],
                referenceId: (string) $attempt->exam_id,
                type: PointTransaction::TYPE_EXAM_SCORE
            );
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to grant Exam XP', [
                'student_id' => $studentId,
                'exam_id' => $attempt->exam_id,
                'error' => $e->getMessage()
            ]);
        }

        \Illuminate\Support\Facades\Log::info('ExamXP processed', [
            'student_id' => $studentId,
            'exam_id'    => $attempt->exam_id,
            'percentage' => $percentage,
        ]);
    }
}
