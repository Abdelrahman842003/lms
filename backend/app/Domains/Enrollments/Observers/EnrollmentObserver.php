<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Observers;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Application\Services\CacheService;

class EnrollmentObserver
{
    public function created(Enrollment $enrollment): void
    {
        if ($enrollment->teacher_profile_id) {
            $profile = \App\Domains\Auth\Models\TeacherProfile::find($enrollment->teacher_profile_id);
            if ($profile) {
                CacheService::forgetTeacherDashboard($profile->teacher_id);
            }
        }
    }

    /**
     * Handle the Enrollment "updated" event.
     */
    public function updated(Enrollment $enrollment): void
    {
        if ($enrollment->teacher_profile_id) {
            $profile = \App\Domains\Auth\Models\TeacherProfile::find($enrollment->teacher_profile_id);
            if ($profile) {
                CacheService::forgetTeacherDashboard($profile->teacher_id);
            }
        }
    }

    /**
     * Handle the Enrollment "deleted" event.
     */
    public function deleted(Enrollment $enrollment): void
    {
        if ($enrollment->teacher_profile_id) {
            $profile = \App\Domains\Auth\Models\TeacherProfile::find($enrollment->teacher_profile_id);
            if ($profile) {
                CacheService::forgetTeacherDashboard($profile->teacher_id);
            }
        }
    }
}
