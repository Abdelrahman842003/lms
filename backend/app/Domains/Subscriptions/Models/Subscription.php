<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Models;

use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Subscriptions\Enums\SubscriptionType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Unified Subscription Model
 * 
 * Supports both Teacher and Academy subscriptions through polymorphic relationship
 */
class Subscription extends Model
{
    use HasFactory, HasUuids;

    protected static function booted(): void
    {
        static::saving(function (self $subscription): void {
            $seats = max(0, (int) ($subscription->seats_count ?? 0));

            if ($subscription->quota_limit === null) {
                $subscription->seats_count = $seats;
                return;
            }

            $quota = max(0, (int) $subscription->quota_limit);
            $subscription->quota_limit = $quota;
            $subscription->seats_count = min($seats, $quota);
        });
    }

    protected $fillable = [
        'subscriber_id',
        'subscriber_type',
        'type',
        'month',
        'seats_count',
        'quota_limit',
        'cost_per_seat',
        'amount_due',
        'amount_paid',
        'status',
        'payment_key',
        'payment_initiated_at',
        'payment_method',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'date',
            'type' => SubscriptionType::class,
            'status' => SubscriptionStatus::class,
            'seats_count' => 'integer',
            'quota_limit' => 'integer',
            'cost_per_seat' => 'decimal:2',
            'amount_due' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'payment_initiated_at' => 'datetime',
            'paid_at' => 'date',
        ];
    }

    /**
     * Polymorphic relationship to subscriber (Teacher or Academy)
     */
    public function subscriber(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Check if subscriber has unlimited quota
     */
    public function hasUnlimitedQuota(): bool
    {
        return $this->quota_limit === null;
    }

    /**
     * Check if quota is exceeded
     */
    public function isQuotaExceeded(): bool
    {
        if ($this->hasUnlimitedQuota()) {
            return false;
        }
        return $this->seats_count >= $this->quota_limit;
    }

    /**
     * Get remaining quota
     */
    public function remainingQuota(): ?int
    {
        if ($this->hasUnlimitedQuota()) {
            return null;
        }
        return max(0, $this->quota_limit - $this->seats_count);
    }

    /**
     * Get remaining amount to pay
     */
    public function remainingAmount(): float
    {
        return max(0, $this->amount_due - $this->amount_paid);
    }

    /**
     * Check if subscription is fully paid
     */
    public function isPaid(): bool
    {
        return $this->status === SubscriptionStatus::PAID;
    }

    /**
     * Check if subscription is pending
     */
    public function isPending(): bool
    {
        return $this->status === SubscriptionStatus::PENDING;
    }

    /**
     * Check if subscription is partially paid
     */
    public function isPartial(): bool
    {
        return $this->status === SubscriptionStatus::PARTIAL;
    }

    /**
     * Update status based on payment amount
     */
    public function updateStatusFromPayment(): void
    {
        if ($this->amount_paid >= $this->amount_due) {
            $this->status = SubscriptionStatus::PAID;
            if (!$this->paid_at) {
                $this->paid_at = now();
            }
        } elseif ($this->amount_paid > 0) {
            $this->status = SubscriptionStatus::PARTIAL;
        } else {
            $this->status = SubscriptionStatus::PENDING;
        }
        $this->save();
    }

    /**
     * Generate unique payment key
     */
    public static function generatePaymentKey(): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        
        do {
            $code = 'SUB-';
            for ($i = 0; $i < 8; $i++) {
                $code .= $chars[random_int(0, strlen($chars) - 1)];
            }

            $exists = self::where('payment_key', $code)->exists();
        } while ($exists);

        return $code;
    }

    /**
     * Scope for active subscriptions
     */
    public function scopeActive($query)
    {
        return $query->where('status', SubscriptionStatus::ACTIVE);
    }

    /**
     * Scope for pending subscriptions
     */
    public function scopePending($query)
    {
        return $query->where('status', SubscriptionStatus::PENDING);
    }

    /**
     * Scope for paid subscriptions
     */
    public function scopePaid($query)
    {
        return $query->where('status', SubscriptionStatus::PAID);
    }

    /**
     * Scope for partial subscriptions
     */
    public function scopePartial($query)
    {
        return $query->where('status', SubscriptionStatus::PARTIAL);
    }

    /**
     * Scope for teacher subscriptions
     */
    public function scopeForTeachers($query)
    {
        return $query->where('type', SubscriptionType::TEACHER);
    }

    /**
     * Scope for academy subscriptions
     */
    public function scopeForAcademies($query)
    {
        return $query->where('type', SubscriptionType::ACADEMY);
    }

    /**
     * Scope for specific month/year
     */
    public function scopeForMonth($query, int $month, int $year)
    {
        $monthStart = sprintf('%04d-%02d-01', $year, $month);
        return $query->where('month', $monthStart);
    }

    /**
     * Scope for filtering
     */
    public function scopeFilter($query, array $filters)
    {
        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }

        if ($type = $filters['type'] ?? null) {
            $query->where('type', $type);
        }

        if ($month = $filters['month'] ?? null) {
            $query->whereMonth('month', $month);
        }

        if ($year = $filters['year'] ?? null) {
            $query->whereYear('month', $year);
        }

        if ($subscriberId = $filters['subscriber_id'] ?? null) {
            $query->where('subscriber_id', $subscriberId);
        }

        if ($subscriberType = $filters['subscriber_type'] ?? null) {
            $query->where('subscriber_type', $subscriberType);
        }
    }
}
