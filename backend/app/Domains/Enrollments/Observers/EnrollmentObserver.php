<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Observers;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Application\Services\CacheService;

class EnrollmentObserver
{
    /**
     * Handle the Enrollment "created" event.
     * Invalidate teacher dashboard when new student enrolls.
     */
    public function created(Enrollment $enrollment): void
    {
        CacheService::forgetTeacherDashboard($enrollment->teacher_id);
    }

    /**
     * Handle the Enrollment "updated" event.
     */
    public function updated(Enrollment $enrollment): void
    {
        CacheService::forgetTeacherDashboard($enrollment->teacher_id);
    }

    /**
     * Handle the Enrollment "deleted" event.
     */
    public function deleted(Enrollment $enrollment): void
    {
        CacheService::forgetTeacherDashboard($enrollment->teacher_id);
    }
}
