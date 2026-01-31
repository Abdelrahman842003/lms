<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Enrollment;
use App\Services\Infrastructure\CacheService;

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
