<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\Notifications\Channels\FcmChannelStrategy;
use Illuminate\Support\Collection;

class SendBulkNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $tokens;
    protected $title;
    protected $message;
    protected $data;

    /**
     * Create a new job instance.
     */
    public function __construct(array $tokens, string $title, string $message, array $data)
    {
        $this->tokens = $tokens;
        $this->title = $title;
        $this->message = $message;
        $this->data = $data;
    }

    /**
     * Execute the job.
     */
    public function handle(FcmChannelStrategy $fcmStrategy): void
    {
        // We use the strategy to send. 
        // Since we have raw tokens, we need a method in strategy that accepts tokens directly.
        // Or we can modify the strategy to accept a collection of "dummy" objects with routeNotificationForFcm.
        
        $fcmStrategy->sendToTokens($this->tokens, $this->title, $this->message, $this->data);
    }
}
