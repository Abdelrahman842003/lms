<?php

declare(strict_types=1);

namespace App\Domains\Auth\Listeners;

use App\Domains\Auth\Events\UserLoggedIn;
use App\Domains\Support\Enums\AuditAction;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * يُسجّل عملية تسجيل الدخول في جدول audit_logs.
 * يعمل على Queue عشان ما يبطّئش الـ response.
 */
class LogLoginAudit implements ShouldQueue
{
    public string $queue = 'default';

    public function handle(UserLoggedIn $event): void
    {
        \DB::table('audit_logs')->insert([
            'user_id'        => $event->user->id,
            'auditable_type' => get_class($event->user),
            'auditable_id'   => $event->user->id,
            'action'         => AuditAction::LOGGED_IN->value,
            'old_values'     => null,
            'new_values'     => null,
            'ip_address'     => $event->ipAddress,
            'user_agent'     => $event->userAgent,
            'extra'          => null,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
    }
}
