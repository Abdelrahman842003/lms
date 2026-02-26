<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Actions;

use App\Domains\Lectures\Events\LectureActivated;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Support\Exceptions\DomainException;

/**
 * تفعيل محاضرة وبثّها Realtime للطلاب.
 */
final class ActivateLectureAction
{
    public function execute(Lecture $lecture): Lecture
    {
        if ($lecture->is_active) {
            throw new DomainException('المحاضرة مفعّلة بالفعل.');
        }

        $lecture->update([
            'is_active'  => true,
            'start_time' => now(),
        ]);

        event(new LectureActivated($lecture->refresh()));

        return $lecture;
    }
}
