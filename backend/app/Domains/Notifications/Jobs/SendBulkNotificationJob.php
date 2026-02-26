<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Jobs;

use App\Domains\Notifications\Channels\FcmChannelStrategy;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendBulkNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $queue = 'notifications';

    public function __construct(
        protected array  $tokens,
        protected string $title,
        protected string $message,
        protected array  $data = [],
    ) {}

    public function handle(FcmChannelStrategy $fcmStrategy): void
    {
        $fcmStrategy->sendToTokens($this->tokens, $this->title, $this->message, $this->data);
    }
}
