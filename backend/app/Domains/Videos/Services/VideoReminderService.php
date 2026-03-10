<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Auth\Models\Student;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoReminder;
use App\Domains\Videos\Models\VideoWatchProgress;

class VideoReminderService
{
    public function __construct(
        private readonly VideoSettingsService $settings,
        private readonly VideoAuthorizationService $authorization,
        private readonly VideoNotificationService $notifications,
    ) {}

    public function processDueReminders(): void
    {
        $maxAttempts = $this->settings->reminderMaxAttempts();
        $intervalHours = $this->settings->reminderIntervalHours();

        $dueReminders = VideoReminder::query()
            ->pending()
            ->with(['video', 'student'])
            ->limit(200)
            ->get();

        foreach ($dueReminders as $reminder) {
            $video = $reminder->video;
            $student = $reminder->student;

            if (! $video || ! $student) {
                $this->stopReminder($reminder, 'invalid_relation');
                continue;
            }

            if ($video->status?->value === 'deleted' || $video->deleted_at !== null) {
                $this->stopReminder($reminder, 'video_deleted');
                continue;
            }

            $progress = VideoWatchProgress::query()
                ->where('video_id', $video->id)
                ->where('student_id', $student->id)
                ->first();

            if ($progress && $progress->status && $progress->status->value !== 'not_started') {
                $this->stopReminder($reminder, 'started');
                continue;
            }

            $access = $this->authorization->checkStudentViewAccess($video, $student);
            if (! $access['allowed']) {
                $this->stopReminder($reminder, 'lost_eligibility');
                continue;
            }

            $attempt = $reminder->attempts + 1;
            $this->notifications->sendReminder($student, $video, $attempt, $maxAttempts);

            $reminder->update([
                'attempts' => $attempt,
                'last_reminded_at' => now(),
                'next_reminder_at' => now()->addHours($intervalHours),
            ]);

            if ($attempt >= $maxAttempts) {
                $this->notifications->sendMissed($student, $video);
                $this->stopReminder($reminder, 'max_attempts_reached');
            }
        }
    }

    public function stopForStudent(Video $video, Student $student, string $reason): void
    {
        VideoReminder::query()
            ->where('video_id', $video->id)
            ->where('student_id', $student->id)
            ->whereNull('stopped_at')
            ->update([
                'stopped_at' => now(),
                'stop_reason' => $reason,
                'next_reminder_at' => null,
            ]);
    }

    public function stopForVideo(Video $video, string $reason): void
    {
        VideoReminder::query()
            ->where('video_id', $video->id)
            ->whereNull('stopped_at')
            ->update([
                'stopped_at' => now(),
                'stop_reason' => $reason,
                'next_reminder_at' => null,
            ]);
    }

    private function stopReminder(VideoReminder $reminder, string $reason): void
    {
        $reminder->update([
            'stopped_at' => now(),
            'stop_reason' => $reason,
            'next_reminder_at' => null,
        ]);
    }
}
