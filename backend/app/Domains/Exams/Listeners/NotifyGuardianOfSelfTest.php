<?php

declare(strict_types=1);

namespace App\Domains\Exams\Listeners;

use App\Domains\Exams\Events\ExamCompleted;
use App\Domains\Auth\Notifications\ParentNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

class NotifyGuardianOfSelfTest implements ShouldQueue
{
    public function handle(ExamCompleted $event): void
    {
        $attempt = $event->attempt;
        $exam = $attempt->exam;

        // Only notify for self-tests
        if ($exam->type->value !== 'self_test' && $exam->type !== 'self_test') {
            return;
        }

        $student = $attempt->student;
        if (!$student) {
            return;
        }

        $guardian = $student->guardian;
        if (!$guardian) {
            return;
        }

        $teacher = $exam->teacher;
        $teacherName = $teacher ? $teacher->name : 'المدرس';

        $title = 'نتيجة اختبار نفسك';
        $message = sprintf(
            'قام ابنكم %s بأداء اختبار (اختبر نفسك) في مادة %s مع الأستاذ %s وحصل على درجة %s/%s بنسبة %s%%',
            $student->name,
            $exam->subject,
            $teacherName,
            $event->score,
            $exam->max_score,
            $event->percentage
        );

        $guardian->notify(new ParentNotification(
            $guardian->id,
            $title,
            $message,
            $teacherName,
            $student->name,
            'exam_result',
            [
                'exam_id' => $exam->id,
                'attempt_id' => $attempt->id,
                'score' => $event->score,
                'percentage' => $event->percentage,
            ]
        ));
    }
}
