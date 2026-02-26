<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Models;

use App\Domains\Auth\Models\Admin;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PlatformPayment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'payable_type',
        'payable_id',
        'amount',
        'payment_key',
        'month',
        'year',
        'status',
        'confirmed_by',
        'confirmed_at',
        'rejected_at',
        'notes',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'month' => 'integer',
            'year' => 'integer',
            'confirmed_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    // ===================
    // Relationships
    // ===================

    /**
     * Get the payable entity (Academy or Teacher)
     */
    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the admin who confirmed/rejected the payment
     */
    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'confirmed_by');
    }

    // ===================
    // Scopes
    // ===================

    /**
     * Get pending payments
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Get confirmed payments
     */
    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    /**
     * Get rejected payments
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Filter by period
     */
    public function scopeForPeriod($query, int $month, int $year)
    {
        return $query->where('month', $month)->where('year', $year);
    }

    /**
     * Filter by payable type
     */
    public function scopeForType($query, string $type)
    {
        return $query->where('payable_type', $type);
    }

    // ===================
    // Static Methods
    // ===================

    /**
     * Generate unique payment key
     * Format: PAY-XXXXXXXX (8 alphanumeric chars)
     */
    public static function generatePaymentKey(): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        
        do {
            $code = 'PAY-';
            for ($i = 0; $i < 8; $i++) {
                $code .= $chars[random_int(0, strlen($chars) - 1)];
            }

            $exists = self::where('payment_key', $code)->exists();
        } while ($exists);

        return $code;
    }

    // ===================
    // Helper Methods
    // ===================

    /**
     * Check if payment is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if payment is confirmed
     */
    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    /**
     * Check if payment is rejected
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Get Arabic month name
     */
    public function getMonthNameAttribute(): string
    {
        $months = [
            1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل',
            5 => 'مايو', 6 => 'يونيو', 7 => 'يوليو', 8 => 'أغسطس',
            9 => 'سبتمبر', 10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر'
        ];
        
        return $months[$this->month] ?? '';
    }

    /**
     * Get payable name (Academy or Teacher name)
     */
    public function getPayableNameAttribute(): string
    {
        return $this->payable?->name ?? 'غير معروف';
    }

    /**
     * Get payable type in Arabic
     */
    public function getPayableTypeArabicAttribute(): string
    {
        return match($this->payable_type) {
            'App\Domains\Auth\Models\Academy' => 'أكاديمية',
            'App\Domains\Auth\Models\Teacher' => 'مدرس',
            default => 'غير معروف',
        };
    }
}
