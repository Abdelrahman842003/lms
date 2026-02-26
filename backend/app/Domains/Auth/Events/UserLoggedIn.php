<?php

declare(strict_types=1);

namespace App\Domains\Auth\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * يُطلق عند تسجيل دخول ناجح لأي نوع مستخدم.
 */
class UserLoggedIn
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Model  $user,
        public readonly ?string $ipAddress,
        public readonly ?string $userAgent,
    ) {}
}
