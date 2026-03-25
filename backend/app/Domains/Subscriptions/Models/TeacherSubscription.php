<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Models;

use App\Domains\Auth\Models\Teacher;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherSubscription extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'teacher_id',
        'month',
        'student_count',
        'notes',
        'status',
        'amount_due',
        'amount_paid',
        'payment_key',
        'payment_initiated_at',
        'price_per_seat',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'date',
            'student_count' => 'integer',
            'amount_due' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'payment_initiated_at' => 'datetime',
            'status' => \App\Domains\Subscriptions\Enums\TeacherSubscriptionStatus::class,
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }



    /**
     * Generate unique payment key
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
}
