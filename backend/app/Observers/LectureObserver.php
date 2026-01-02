<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Lecture;
use App\Services\Infrastructure\CacheService;

class LectureObserver
{
    /**
     * Handle the Lecture "created" event.
     */
    public function created(Lecture $lecture): void
    {
        CacheService::forgetLecture($lecture->id, $lecture->teacher_id);
    }

    /**
     * Handle the Lecture "updated" event.
     */
    public function updated(Lecture $lecture): void
    {
        CacheService::forgetLecture($lecture->id, $lecture->teacher_id);
    }

    /**
     * Handle the Lecture "deleted" event.
     */
    public function deleted(Lecture $lecture): void
    {
        CacheService::forgetLecture($lecture->id, $lecture->teacher_id);
    }
}
