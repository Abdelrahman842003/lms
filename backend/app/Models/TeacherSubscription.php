<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherSubscription extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'teacher_id',
        'month',
        'student_count',
        'amount_due',
        'amount_paid',
        'status',
        'notes',
        'payment_key',
        'payment_initiated_at',
        'payment_method',
    ];

    protected $casts = [
        'month' => 'date',
        'student_count' => 'integer',
        'amount_due' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'payment_initiated_at' => 'datetime',
        'status' => \App\Enums\TeacherSubscriptionStatus::class,
    ];

    public function teacher()
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
