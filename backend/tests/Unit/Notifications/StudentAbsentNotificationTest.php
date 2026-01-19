<?php

namespace Tests\Unit\Notifications;

use App\Notifications\StudentAbsentNotification;
use Tests\TestCase;

class StudentAbsentNotificationTest extends TestCase
{
    public function test_notification_has_correct_data()
    {
        $lectureTitle = 'Math 101';
        $teacherName = 'Mr. Smith';
        $academyName = 'Excellence Academy';

        $notification = new StudentAbsentNotification($lectureTitle, $teacherName, $academyName);

        $data = $notification->toArray(new \stdClass());

        $this->assertEquals('تسجيل غياب', $data['title']);
        $this->assertEquals("لقد تم تسجيلك غائب في محاضرة: {$lectureTitle} للمدرس {$teacherName} في أكاديمية {$academyName}", $data['message']);
        $this->assertEquals('absent', $data['type']);
        $this->assertEquals($lectureTitle, $data['lecture_title']);
        $this->assertEquals($teacherName, $data['teacher_name']);
        $this->assertEquals($academyName, $data['academy_name']);
    }
}
