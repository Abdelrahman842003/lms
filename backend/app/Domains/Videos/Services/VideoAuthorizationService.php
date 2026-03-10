<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Auth\Models\Student;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAccessGrant;

class VideoAuthorizationService
{
    public function __construct(
        private readonly VideoAccessLoggerService $accessLogger,
    ) {}

    /**
     * @return array{allowed:bool,reason:?string,grant:?VideoAccessGrant,enrollment:?Enrollment}
     */
    public function checkStudentViewAccess(Video $video, Student $student): array
    {
        if ($video->status !== VideoStatus::PUBLISHED) {
            return [
                'allowed' => false,
                'reason' => 'video_not_published',
                'grant' => null,
                'enrollment' => null,
            ];
        }

        if ($video->available_from && $video->available_from->isFuture()) {
            return [
                'allowed' => false,
                'reason' => 'video_not_available_yet',
                'grant' => null,
                'enrollment' => null,
            ];
        }

        if ($video->available_until && $video->available_until->isPast()) {
            return [
                'allowed' => false,
                'reason' => 'video_availability_ended',
                'grant' => null,
                'enrollment' => null,
            ];
        }

        $grant = VideoAccessGrant::query()
            ->where('video_id', $video->id)
            ->where('student_id', $student->id)
            ->whereNull('revoked_at')
            ->first();

        if (! $grant) {
            return [
                'allowed' => false,
                'reason' => 'access_not_granted',
                'grant' => null,
                'enrollment' => null,
            ];
        }

        $enrollment = Enrollment::query()->whereKey($grant->enrollment_id)->first();
        if (! $enrollment || ! $enrollment->is_active) {
            return [
                'allowed' => false,
                'reason' => 'inactive_enrollment',
                'grant' => $grant,
                'enrollment' => $enrollment,
            ];
        }

        if ($enrollment->status !== 'active') {
            return [
                'allowed' => false,
                'reason' => 'subscription_inactive',
                'grant' => $grant,
                'enrollment' => $enrollment,
            ];
        }

        if ($enrollment->teacher && $enrollment->teacher->getRawOriginal('status') !== 'active') {
            return [
                'allowed' => false,
                'reason' => 'teacher_inactive',
                'grant' => $grant,
                'enrollment' => $enrollment,
            ];
        }

        return [
            'allowed' => true,
            'reason' => null,
            'grant' => $grant,
            'enrollment' => $enrollment,
        ];
    }

    public function assertStudentCanView(Video $video, Student $student): void
    {
        $result = $this->checkStudentViewAccess($video, $student);

        if (! $result['allowed']) {
            throw new \Illuminate\Auth\Access\AuthorizationException('غير مصرح بمشاهدة هذا الفيديو حالياً.');
        }
    }
}
