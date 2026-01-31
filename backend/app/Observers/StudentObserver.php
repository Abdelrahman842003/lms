<?php

declare(strict_types=1);

namespace App\Observers;

use App\Models\Student;
use App\Services\Infrastructure\CacheService;

class StudentObserver
{
    /**
     * Handle the Student "updated" event.
     */
    public function updated(Student $student): void
    {
        // Get the original phone if it was changed
        $originalPhone = $student->getOriginal('phone');
        $currentPhone = $student->phone;
        
        // Forget old phone cache if phone changed
        if ($originalPhone !== $currentPhone && $originalPhone) {
            CacheService::forgetStudent($student->id, $originalPhone);
        }
        
        // Forget current cache
        CacheService::forgetStudent($student->id, $currentPhone);
    }

    /**
     * Handle the Student "deleted" event.
     */
    public function deleted(Student $student): void
    {
        CacheService::forgetStudent($student->id, $student->phone);
    }
}
