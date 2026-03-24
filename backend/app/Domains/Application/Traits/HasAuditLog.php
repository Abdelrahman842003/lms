<?php

declare(strict_types=1);

namespace App\Domains\Application\Traits;

use App\Domains\Application\Enums\AuditAction;

/**
 * أضف هذا الـ trait لأي Model تريد تتبع تغييراته تلقائياً.
 *
 * يُسجّل في جدول audit_logs عند:
 *  - created / updated / deleted / restored
 */
trait HasAuditLog
{
    public static function bootHasAuditLog(): void
    {
        static::created(fn ($model) => $model->logAudit(AuditAction::CREATED));
        static::updated(fn ($model) => $model->logAudit(AuditAction::UPDATED));
        static::deleted(fn ($model) => $model->logAudit(AuditAction::DELETED));

        if (method_exists(static::class, 'restored')) {
            static::restored(fn ($model) => $model->logAudit(AuditAction::RESTORED));
        }
    }

    /**
     * تسجيل عملية تدقيق.
     */
    public function logAudit(AuditAction $action, array $extra = []): void
    {
        $userId = auth()->id();

        \DB::table('audit_logs')->insert([
            'user_id'        => $userId,
            'auditable_type' => get_class($this),
            'auditable_id'   => $this->getKey(),
            'action'         => $action->value,
            'old_values'     => $action === AuditAction::UPDATED
                ? json_encode($this->getOriginal())
                : null,
            'new_values'     => in_array($action, [AuditAction::CREATED, AuditAction::UPDATED])
                ? json_encode($this->getAttributes())
                : null,
            'ip_address'     => request()?->ip(),
            'user_agent'     => request()?->userAgent(),
            'extra'          => $extra ? json_encode($extra) : null,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
    }
}
