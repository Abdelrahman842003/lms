<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Models;

use App\Domains\Auth\Models\Academy;
use App\Domains\Application\Traits\GuardsSensitiveFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcademySubscription extends Model
{
    use GuardsSensitiveFields;
    use HasFactory, HasUuids;

    protected $fillable = [
        'academy_id',
        'month',
        'student_count',
        'price_per_seat',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'date',
            'student_count' => 'integer',
            'price_per_seat' => 'decimal:2',
            'amount_due' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'payment_initiated_at' => 'datetime',
            'status' => \App\Domains\Subscriptions\Enums\TeacherSubscriptionStatus::class,
        ];
    }

    public function academy(): BelongsTo
    {
        return $this->belongsTo(Academy::class);
    }

    /**
     * Generate unique payment key
     */
    public static function generatePaymentKey(): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        
        do {
            $code = 'APAY-';
            for ($i = 0; $i < 8; $i++) {
                $code .= $chars[random_int(0, strlen($chars) - 1)];
            }

            $exists = self::where('payment_key', $code)->exists();
        } while ($exists);

        return $code;
    }
}
