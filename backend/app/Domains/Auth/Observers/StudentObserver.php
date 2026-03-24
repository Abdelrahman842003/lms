<?php

declare(strict_types=1);

namespace App\Domains\Auth\Observers;

use App\Domains\Auth\Models\Student;
use App\Domains\Application\Services\CacheService;

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
