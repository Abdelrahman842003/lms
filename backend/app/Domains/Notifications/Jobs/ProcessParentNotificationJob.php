<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Jobs;

use App\Domains\Auth\Models\Student;
use App\Domains\Notifications\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessParentNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected Student $student,
        protected string $title,
        protected string $message,
        protected array $data = [],
        protected string $type = 'general'
    ) {}

    public function handle(NotificationService $notificationService): void
    {
        $notificationService->sendToParent(
            $this->student,
            $this->title,
            $this->message,
            $this->data,
            $this->type
        );
    }
}
