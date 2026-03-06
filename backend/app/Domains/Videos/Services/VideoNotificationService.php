<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\Student;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAccessGrant;
use App\Domains\Videos\Notifications\VideoCompletedGuardianNotification;
use App\Domains\Videos\Notifications\VideoMissedNotification;
use App\Domains\Videos\Notifications\VideoPublishedGuardianNotification;
use App\Domains\Videos\Notifications\VideoPublishedStudentNotification;
use App\Domains\Videos\Notifications\VideoReminderNotification;
use Illuminate\Support\Collection;

class VideoNotificationService
{
    public function __construct(
        private readonly VideoSettingsService $settings,
    ) {}

    /**
     * @param Collection<int, VideoAccessGrant> $grants
     */
    public function sendPublishedNotifications(Video $video, Collection $grants): void
    {
        if (! $this->settings->notificationsEnabled()) {
            return;
        }

        $studentIds = $grants->pluck('student_id')->filter()->unique()->values()->all();
        if ($studentIds === []) {
            return;
        }

        $students = Student::query()->whereIn('id', $studentIds)->get();

        foreach ($students as $student) {
            $student->notify(new VideoPublishedStudentNotification($video));

            $guardian = $this->resolveGuardian($student);
            if ($guardian) {
                $guardian->notify(new VideoPublishedGuardianNotification($video, $student));
            }
        }
    }

    public function sendReminder(Student $student, Video $video, int $attempt, int $maxAttempts): void
    {
        if (! $this->settings->notificationsEnabled()) {
            return;
        }

        $student->notify(new VideoReminderNotification($video, $attempt, $maxAttempts));
    }

    public function sendMissed(Student $student, Video $video): void
    {
        if (! $this->settings->notificationsEnabled()) {
            return;
        }

        $student->notify(new VideoMissedNotification($video));
    }

    public function sendCompletedToGuardian(Student $student, Video $video): void
    {
        if (! $this->settings->notificationsEnabled()) {
            return;
        }

        $guardian = $this->resolveGuardian($student);
        if ($guardian) {
            $guardian->notify(new VideoCompletedGuardianNotification($video, $student));
        }
    }

    private function resolveGuardian(Student $student): ?Guardian
    {
        if ($student->guardian_id) {
            return Guardian::query()->find($student->guardian_id);
        }

        if ($student->parent_phone) {
            return Guardian::query()->where('phone', $student->parent_phone)->first();
        }

        return null;
    }
}
