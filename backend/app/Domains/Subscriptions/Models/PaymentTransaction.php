<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Domains\Subscriptions\Enums\PaymentTransactionStatus;
use App\Domains\Subscriptions\Enums\PaymentMethod;

class PaymentTransaction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'payer_id',
        'payer_type',
        'subscription_id',
        'payment_key',
        'gateway',
        'gateway_reference',
        'payment_method',
        'amount',
        'currency',
        'description',
        'sender_phone',
        'sender_name',
        'proof_image_key',
        'status',
        'expires_at',
        'confirmed_at',
        'confirmed_by',
        'rejected_at',
        'rejection_reason',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'status' => PaymentTransactionStatus::class,
            'payment_method' => PaymentMethod::class,
            'expires_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $transaction): void {
            if (empty($transaction->payment_key)) {
                $transaction->payment_key = self::generatePaymentKey();
            }
        });
    }

    /**
     * Polymorphic relation to Teacher or Academy (payer)
     */
    public function payer(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Relation to Subscription
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /**
     * Relation to Admin who confirmed the payment
     */
    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\Application\Models\Admin::class, 'confirmed_by');
    }

    public function isPending(): bool
    {
        return $this->status === PaymentTransactionStatus::PENDING;
    }

    public function isConfirmed(): bool
    {
        return $this->status === PaymentTransactionStatus::CONFIRMED;
    }

    public function isRejected(): bool
    {
        return $this->status === PaymentTransactionStatus::REJECTED;
    }

    public function isExpired(): bool
    {
        return $this->status === PaymentTransactionStatus::EXPIRED;
    }

    /**
     * Generate unique payment key for transactions
     */
    public static function generatePaymentKey(): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        
        do {
            $code = 'TXN-';
            for ($i = 0; $i < 8; $i++) {
                $code .= $chars[random_int(0, strlen($chars) - 1)];
            }

            $exists = self::where('payment_key', $code)->exists();
        } while ($exists);

        return $code;
    }

    public function scopePending($query)
    {
        return $query->where('status', PaymentTransactionStatus::PENDING->value);
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', PaymentTransactionStatus::CONFIRMED->value);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', PaymentTransactionStatus::REJECTED->value);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', PaymentTransactionStatus::EXPIRED->value);
    }
}
