<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Events;

use App\Domains\Lectures\Models\Lecture;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُطلق عند إنشاء / جدولة محاضرة مستقبلية.
 */
class LectureScheduled
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Lecture $lecture,
    ) {}
}
