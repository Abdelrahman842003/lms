<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Videos\Enums\VideoOwnerType;
use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAccessGrant;
use Illuminate\Database\Eloquent\Builder;

class VideoAuthorizationService
{
    /**
     * Enrollment statuses that can access student videos.
     *
     * @var array<int, string>
     */
    private const ACCESSIBLE_ENROLLMENT_STATUSES = ['active', 'grace_period', 'trial'];

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
            $fallbackEnrollment = $this->resolveEligibleEnrollmentWithoutGrant($video, $student);

            if (! $fallbackEnrollment) {
                return [
                    'allowed' => false,
                    'reason' => 'access_not_granted',
                    'grant' => null,
                    'enrollment' => null,
                ];
            }

            return [
                'allowed' => true,
                'reason' => null,
                'grant' => null,
                'enrollment' => $fallbackEnrollment,
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

        if (! $this->isEnrollmentStatusAccessible($enrollment->status)) {
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

    public function applyEligibleEnrollmentVisibilityConstraint(Builder $query, Student $student, bool $orWhere = false): Builder
    {
        $videoTable = (new Video())->getTable();
        $enrollmentsTable = (new Enrollment())->getTable();
        $videoGroupsTable = 'video_group_targets';
        $teachersTable = (new Teacher())->getTable();
        $today = now()->toDateString();
        $whereMethod = $orWhere ? 'orWhereExists' : 'whereExists';

        return $query->{$whereMethod}(function ($exists) use (
            $student,
            $videoTable,
            $enrollmentsTable,
            $videoGroupsTable,
            $teachersTable,
            $today
        ): void {
            $exists->selectRaw('1')
                ->from("{$enrollmentsTable} as e")
                ->where('e.student_id', $student->id)
                ->where('e.is_active', true)
                ->whereNull('e.deleted_at')
                ->whereColumn('e.grade_id', "{$videoTable}.grade_id")
                ->where(function ($ownerMatch) use ($videoTable): void {
                    $ownerMatch
                        ->where(function ($teacherOwner) use ($videoTable): void {
                            $teacherOwner
                                ->whereColumn("{$videoTable}.owner_id", 'e.teacher_id')
                                ->where("{$videoTable}.owner_type", VideoOwnerType::INDEPENDENT_TEACHER->value);
                        })
                        ->orWhere(function ($academyOwner) use ($videoTable): void {
                            $academyOwner
                                ->whereColumn("{$videoTable}.academy_id", 'e.academy_id')
                                ->where("{$videoTable}.owner_type", VideoOwnerType::ACADEMY->value);
                        });
                })
                ->where(function ($groupScope) use ($videoTable, $videoGroupsTable): void {
                    $groupScope
                        ->whereNotExists(function ($noTargets) use ($videoTable, $videoGroupsTable): void {
                            $noTargets
                                ->selectRaw('1')
                                ->from("{$videoGroupsTable} as vgt")
                                ->whereColumn('vgt.video_id', "{$videoTable}.id");
                        })
                        ->orWhereExists(function ($targetMatch) use ($videoTable, $videoGroupsTable): void {
                            $targetMatch
                                ->selectRaw('1')
                                ->from("{$videoGroupsTable} as vgt")
                                ->whereColumn('vgt.video_id', "{$videoTable}.id")
                                ->whereColumn('vgt.group_id', 'e.group_id');
                        });
                })
                ->where(function ($teacherState) use ($teachersTable): void {
                    $teacherState
                        ->whereNull('e.teacher_id')
                        ->orWhereExists(function ($activeTeacher) use ($teachersTable): void {
                            $activeTeacher
                                ->selectRaw('1')
                                ->from("{$teachersTable} as t")
                                ->whereColumn('t.id', 'e.teacher_id')
                                ->where('t.status', 'active');
                        });
                });
        });
    }

    private function resolveEligibleEnrollmentWithoutGrant(Video $video, Student $student): ?Enrollment
    {
        $video->loadMissing('groups:id');
        $groupIds = collect($video->groups ?? [])->pluck('id')->filter()->values();

        $query = Enrollment::query()
            ->with('teacher:teachers.id,teachers.status')
            ->where('student_id', $student->id)
            ->where('grade_id', $video->grade_id)
            ->where('is_active', true)
            ->whereNull('deleted_at');

        if ($video->owner_type === VideoOwnerType::INDEPENDENT_TEACHER) {
            $query->where('teacher_id', $video->owner_id);
        } else {
            $query->where('academy_id', $video->academy_id);
        }

        if ($groupIds->isNotEmpty()) {
            $query->whereIn('group_id', $groupIds->all());
        }

        $enrollment = $query->latest('subscription_end')->first();
        if (! $enrollment) {
            return null;
        }

        if (! $this->isEnrollmentStatusAccessible($enrollment->status)) {
            return null;
        }

        if ($enrollment->teacher && $enrollment->teacher->getRawOriginal('status') !== 'active') {
            return null;
        }

        return $enrollment;
    }

    private function isEnrollmentStatusAccessible(string $status): bool
    {
        return in_array($status, self::ACCESSIBLE_ENROLLMENT_STATUSES, true);
    }

    public function assertStudentCanView(Video $video, Student $student): void
    {
        $result = $this->checkStudentViewAccess($video, $student);

        if (! $result['allowed']) {
            throw new \Illuminate\Auth\Access\AuthorizationException('غير مصرح بمشاهدة هذا الفيديو حالياً.');
        }
    }
}
