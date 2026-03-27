<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\Auth\Models\Academy;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Lectures\Notifications\LectureStatusNotification;
use Illuminate\Console\Command;

class TestReverb extends Command
{
    protected $signature = 'reverb:test';
    protected $description = 'Send a test broadcast to the first academy/teacher';

    public function handle()
    {
        $lecture = Lecture::first();
        if (!$lecture) {
            $this->error('No lectures found to test with.');
            return;
        }

        $teacher = $lecture->teacher;
        $academy = $lecture->academy;

        if ($teacher) {
            $this->info("Sending test broadcast to teacher: {$teacher->name}");
            $teacher->notify(new LectureStatusNotification($lecture, 'active'));
        }

        if ($academy) {
            $this->info("Sending test broadcast to academy: {$academy->name}");
            $academy->notify(new LectureStatusNotification($lecture, 'active'));
        }

        $this->info('Broadcasts sent to queue.');
    }
}
