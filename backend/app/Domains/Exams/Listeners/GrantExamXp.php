<?php

declare(strict_types=1);

namespace App\Domains\Exams\Listeners;

use App\Domains\Exams\Events\ExamCompleted;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * يستمع لـ ExamCompleted ويمنح الطالب XP بناءً على أداءه.
 *
 * يفوّض العملية لـ GrantXpAction (Phase 9 – Gamification).
 * حالياً placeholder حتى يكتمل تنفيذ Gamification Domain.
 */
class GrantExamXp implements ShouldQueue
{
    public string $queue = 'default';

    public function handle(ExamCompleted $event): void
    {
        $attempt    = $event->attempt;
        $studentId  = (int) $attempt->student_id;
        $percentage = $event->percentage;

        // XP rule:
        //  - percentage >= 90 → 50 XP
        //  - percentage >= 70 → 30 XP
        //  - percentage >= 50 → 15 XP
        //  - أقل → 5 XP (مجرد مشاركة)
        $xp = match (true) {
            $percentage >= 90 => 50,
            $percentage >= 70 => 30,
            $percentage >= 50 => 15,
            default           => 5,
        };

        // TODO: استبدل بـ GrantXpAction بعد تنفيذ Phase 9
        // app(GrantXpAction::class)->execute($studentId, $xp, 'exam', $attempt->exam_id);

        \Illuminate\Support\Facades\Log::info('ExamXP queued', [
            'student_id' => $studentId,
            'exam_id'    => $attempt->exam_id,
            'xp'         => $xp,
            'percentage' => $percentage,
        ]);
    }
}
