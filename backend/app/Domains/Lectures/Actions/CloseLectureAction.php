<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Actions;

use App\Domains\Lectures\Events\LectureClosed;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Application\Exceptions\DomainException;

/**
 * إغلاق محاضرة نشطة وبثّ الحدث.
 */
final class CloseLectureAction
{
    public function execute(Lecture $lecture): Lecture
    {
        if (! $lecture->is_active) {
            throw new DomainException('المحاضرة غير نشطة أصلاً.');
        }

        $lecture->update([
            'is_active' => false,
            'end_time'  => now(),
        ]);

        event(new LectureClosed($lecture->refresh()));

        return $lecture;
    }
}
