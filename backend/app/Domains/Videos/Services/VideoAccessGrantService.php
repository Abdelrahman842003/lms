<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Videos\Enums\VideoOwnerType;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAccessGrant;
use App\Domains\Videos\Models\VideoReminder;
use Illuminate\Support\Collection;

class VideoAccessGrantService
{
    public function __construct(
        private readonly VideoSettingsService $settings,
    ) {}

    /**
     * Grants access snapshot at publication time.
     * Optimized to use batch upsert instead of individual updateOrCreate calls.
     *
     * @return Collection<int, VideoAccessGrant>
     */
    public function createPublicationGrants(Video $video): Collection
    {
        $video->loadMissing('groups:id');
        $groupIds = $video->groups->pluck('id')->all();

        $query = Enrollment::query()
            ->with('student:id,name,parent_phone,guardian_id')
            ->where('grade_id', $video->grade_id)
            ->where('is_active', true)
            ->whereNull('deleted_at');

        if (! empty($groupIds)) {
            $query->whereIn('group_id', $groupIds);
        }

        if ($video->owner_type === VideoOwnerType::INDEPENDENT_TEACHER) {
            $query->where('teacher_id', $video->owner_id);
        } else {
            $query->where('academy_id', $video->academy_id);
        }

        $eligible = $query->get()->filter(function (Enrollment $enrollment): bool {
            return $enrollment->status === 'active';
        });

        if ($eligible->isEmpty()) {
            return collect();
        }

        $now = now();
        $reminderInterval = $this->settings->reminderIntervalHours();

        // Prepare batch data for VideoAccessGrant upsert
        $grantsData = $eligible->map(function (Enrollment $enrollment) use ($video, $now) {
            return [
                'video_id' => $video->id,
                'student_id' => $enrollment->student_id,
                'teacher_id' => $enrollment->teacher_id,
                'enrollment_id' => $enrollment->id,
                'granted_group_id' => $enrollment->group_id,
                'granted_at' => $now,
                'revoked_at' => null,
                'revoked_reason' => null,
                'eligibility_snapshot' => json_encode([
                    'grade_id' => $enrollment->grade_id,
                    'group_id' => $enrollment->group_id,
                    'academy_id' => $enrollment->academy_id,
                    'teacher_id' => $enrollment->teacher_id,
                    'status' => $enrollment->status,
                ]),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        })->toArray();

        // Batch upsert VideoAccessGrants (single query instead of N queries)
        VideoAccessGrant::upsert(
            $grantsData,
            ['video_id', 'student_id'], // Unique columns
            [
                'teacher_id',
                'enrollment_id',
                'granted_group_id',
                'granted_at',
                'revoked_at',
                'revoked_reason',
                'eligibility_snapshot',
                'updated_at',
            ] // Columns to update if record exists
        );

        // Prepare batch data for VideoReminder upsert
        $remindersData = $eligible->map(function (Enrollment $enrollment) use ($video, $now, $reminderInterval) {
            return [
                'video_id' => $video->id,
                'student_id' => $enrollment->student_id,
                'guardian_id' => $enrollment->student?->guardian_id,
                'attempts' => 0,
                'next_reminder_at' => $now->copy()->addHours($reminderInterval),
                'last_reminded_at' => null,
                'stopped_at' => null,
                'stop_reason' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        })->toArray();

        // Batch upsert VideoReminders (single query instead of N queries)
        VideoReminder::upsert(
            $remindersData,
            ['video_id', 'student_id'], // Unique columns
            [
                'guardian_id',
                'attempts',
                'next_reminder_at',
                'last_reminded_at',
                'stopped_at',
                'stop_reason',
                'updated_at',
            ] // Columns to update if record exists
        );

        // Fetch and return the created/updated grants
        return VideoAccessGrant::query()
            ->where('video_id', $video->id)
            ->whereIn('student_id', $eligible->pluck('student_id'))
            ->get();
    }

    public function stopReminder(Video $video, string $studentId, string $reason): void
    {
        VideoReminder::query()
            ->where('video_id', $video->id)
            ->where('student_id', $studentId)
            ->whereNull('stopped_at')
            ->update([
                'stopped_at' => now(),
                'stop_reason' => $reason,
                'next_reminder_at' => null,
            ]);
    }
}
