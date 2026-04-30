<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Domains\Notifications\Services\NotificationService;
use Illuminate\Database\Eloquent\Model;

class ProcessNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected Model $notifiable,
        protected string $userType,
        protected string $title,
        protected string $message,
        protected array $data = [],
        protected string $type = 'general',
        protected bool $sendFcm = true
    ) {}

    public function handle(NotificationService $notificationService): void
    {
        $notificationService->send(
            $this->notifiable,
            $this->userType,
            $this->title,
            $this->message,
            $this->data,
            $this->type,
            $this->sendFcm
        );
    }
}
