<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Secretary;

class AcademyNotification extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'academy_id',
        'created_by',
        'title',
        'message',
        'type',
        'target_type',
        'target_ids',
        'recipient_count',
        'recipient_snapshot',
        'read_by',
    ];

    protected $casts = [
        'target_ids' => 'array',
        'recipient_count' => 'integer',
        'recipient_snapshot' => 'array',
        'read_by' => 'array',
        'type' => \App\Domains\Notifications\Enums\NotificationType::class,
        'target_type' => \App\Domains\Notifications\Enums\NotificationTargetType::class,
    ];

    /**
     * Academy relationship
     */
    public function academy()
    {
        return $this->belongsTo(Academy::class);
    }

    /**
     * Creator (Secretary) relationship
     */
    public function creator()
    {
        return $this->belongsTo(Secretary::class, 'created_by');
    }

    /**
     * Check if notification was read by a user
     */
    public function isReadBy(string $userId): bool
    {
        return in_array($userId, $this->read_by ?? []);
    }

    /**
     * Mark as read by a user
     */
    public function markAsReadBy(string $userId): void
    {
        $readBy = $this->read_by ?? [];
        if (!in_array($userId, $readBy)) {
            $readBy[] = $userId;
            $this->update(['read_by' => $readBy]);
        }
    }

    /**
     * Scope for specific academy
     */
    public function scopeForAcademy($query, string $academyId)
    {
        return $query->where('academy_id', $academyId);
    }

    /**
     * Scope for specific target type
     */
    public function scopeForTarget($query, string $targetType)
    {
        return $query->where('target_type', $targetType);
    }

    /**
     * Scope for unread by user
     */
    public function scopeUnreadBy($query, string $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->whereNull('read_by')
              ->orWhereJsonDoesntContain('read_by', $userId);
        });
    }
}
