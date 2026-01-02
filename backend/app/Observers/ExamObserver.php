<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Exam;
use App\Services\Infrastructure\CacheService;

class ExamObserver
{
    /**
     * Handle the Exam "created" event.
     */
    public function created(Exam $exam): void
    {
        CacheService::forgetExam($exam->id, $exam->teacher_id);
    }

    /**
     * Handle the Exam "updated" event.
     */
    public function updated(Exam $exam): void
    {
        CacheService::forgetExam($exam->id, $exam->teacher_id);
    }

    /**
     * Handle the Exam "deleted" event.
     */
    public function deleted(Exam $exam): void
    {
        CacheService::forgetExam($exam->id, $exam->teacher_id);
    }
}
