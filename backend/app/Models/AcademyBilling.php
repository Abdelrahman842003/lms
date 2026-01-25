<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class AcademyBilling extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'academy_id',
        'month',
        'year',
        'total_students',
        'cost_per_student',
        'total_cost',
        'amount_paid',
        'status',
        'paid_at',
        'notes',
        'payment_key',
        'payment_initiated_at',
        'payment_method',
    ];

    protected $casts = [
        'month' => 'integer',
        'year' => 'integer',
        'total_students' => 'integer',
        'cost_per_student' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'paid_at' => 'date',
        'payment_initiated_at' => 'datetime',
    ];

    /**
     * Academy relationship
     */
    public function academy()
    {
        return $this->belongsTo(Academy::class);
    }

    /**
     * Scope for pending billings
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for paid billings
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    /**
     * Scope for specific month/year
     */
    public function scopeForPeriod($query, int $month, int $year)
    {
        return $query->where('month', $month)->where('year', $year);
    }

    /**
     * Scope for billings awaiting InstaPay confirmation
     * (has payment_key but not yet paid)
     */
    public function scopeAwaitingInstapayConfirmation($query)
    {
        return $query->whereNotNull('payment_key')
                     ->where('status', '!=', 'paid')
                     ->whereNotNull('payment_initiated_at');
    }

    /**
     * Scope for filtering
     */
    public function scopeFilter($query, array $filters)
    {
        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }

        if ($month = $filters['month'] ?? null) {
            $query->where('month', $month);
        }

        if ($year = $filters['year'] ?? null) {
            $query->where('year', $year);
        }

        if ($academyId = $filters['academy_id'] ?? null) {
            $query->where('academy_id', $academyId);
        }
    }

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
     * Get remaining balance
     */
    public function getRemainingBalanceAttribute(): float
    {
        return (float) $this->total_cost - (float) $this->amount_paid;
    }
}

