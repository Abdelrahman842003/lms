<?php

declare(strict_types=1);

namespace Tests\Unit\Exams\Notifications;

use App\Domains\Auth\Models\Student;
use App\Domains\Exams\Models\ExamResult;
use App\Domains\Exams\Notifications\ExamResultNotification;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ExamNotificationsChannelTest extends TestCase
{
    #[Test]
    public function student_model_uses_student_notifications_channel(): void
    {
        $student = new Student();
        $student->id = 'student-123';

        $this->assertSame(
            'notifications.student.student-123',
            $student->receivesBroadcastNotificationsOn()
        );
    }

    #[Test]
    public function exam_result_notification_broadcasts_to_student_channel(): void
    {
        $result = new ExamResult([
            'student_id' => 'student-123',
        ]);

        $notification = new ExamResultNotification($result, []);
        $channels = $notification->broadcastOn();

        $this->assertCount(1, $channels);
        $this->assertSame('private-notifications.student.student-123', $channels[0]->name);
    }
}
