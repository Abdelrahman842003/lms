<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PaymentLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'client_side_uuid',
        'enrollment_id',
        'student_id',
        'teacher_id',
        'amount',
        'months',
        'discount',
        'commission',
        'base_price',
        'teacher_amount',
        'price_source',
        'confirmation_code',
        'status',
        'payment_method',
        'received_by_id',
        'received_by_type',
        'confirmed_at',
        'expires_at',
        'ip_address',
        'device_info',
        'device_info',
        'notes',
        'meta',
        'start_date',
        'end_date',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'confirmed_at' => 'datetime',
            'expires_at' => 'datetime',
            'meta' => 'array',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    // ===================
    // Relationships
    // ===================

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    /**
     * Get the receiver (Teacher or Secretary) who received the payment
     */
    public function receiver(): MorphTo
    {
        return $this->morphTo('received_by');
    }

    // ===================
    // Scopes
    // ===================

    /**
     * Get pending payments (not expired)
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending')
                     ->where('expires_at', '>', now());
    }

    /**
     * Get confirmed payments
     */
    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    /**
     * Get expired payments
     */
    public function scopeExpired($query)
    {
        return $query->where('status', 'expired')
                     ->orWhere(function ($q) {
                         $q->where('status', 'pending')
                           ->where('expires_at', '<=', now());
                     });
    }

    /**
     * Filter by teacher
     */
    public function scopeForTeacher($query, string $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    /**
     * Filter by student
     */
    public function scopeForStudent($query, string $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    // ===================
    // Static Methods
    // ===================

    /**
     * Generate unique confirmation code (per student)
     * Format: XXXX-XXXX (excluding confusing chars like O, 0, I, 1)
     */
    public static function generateCode(string $studentId): string
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        
        do {
            $code = '';
            for ($i = 0; $i < 4; $i++) {
                $code .= $chars[random_int(0, strlen($chars) - 1)];
            }
            $code .= '-';
            for ($i = 0; $i < 4; $i++) {
                $code .= $chars[random_int(0, strlen($chars) - 1)];
            }

            // Check uniqueness per student (not system-wide)
            $exists = self::where('confirmation_code', $code)
                         ->where('student_id', $studentId)
                         ->where('status', 'pending')
                         ->exists();
        } while ($exists);

        return $code;
    }

    // ===================
    // Accessors
    // ===================

    /**
     * Check if payment is expired
     */
    public function getIsExpiredAttribute(): bool
    {
        return $this->status === 'expired' || 
               ($this->status === 'pending' && $this->expires_at <= now());
    }

    /**
     * Get days until expiration
     */
    public function getDaysUntilExpirationAttribute(): int
    {
        if ($this->status !== 'pending') {
            return 0;
        }
        return (int) now()->diffInDays($this->expires_at, false);
    }
}
