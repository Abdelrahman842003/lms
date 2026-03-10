<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Models;

use App\Domains\Gamification\Enums\PointTransactionType;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PointTransaction extends Model
{
    use HasUuids;

    // Keep constants for backward compatibility
    const TYPE_ATTENDANCE = 'attendance';
    const TYPE_PERFECT_MONTH = 'perfect_month';
    const TYPE_EXAM_SCORE = 'exam_score';
    const TYPE_EXAM_RETAKE_BONUS = 'exam_retake_bonus';
    const TYPE_EXAM_FIRST_PLACE = 'exam_first_place';
    const TYPE_STREAK_5 = 'streak_5';
    const TYPE_STREAK_10 = 'streak_10';
    const TYPE_MANUAL_BONUS = 'manual_bonus';
    // Video constants
    const TYPE_VIDEO_WATCHED     = 'video_watched';
    const TYPE_VIDEO_QUIZ_PASSED  = 'video_quiz_passed';
    const TYPE_VIDEO_QUIZ_PERFECT = 'video_quiz_perfect';
    const TYPE_VIDEO_FIRST_WATCH  = 'video_first_watch';

    protected $fillable = [
        'student_id',
        'teacher_id',
        'type',
        'points',
        'reference_type',
        'reference_id',
        'description',
    ];

    protected $casts = [
        'points' => 'integer',
    ];

    protected $appends = ['type_name'];

    protected static function boot()
    {
        parent::boot();

        // Validate type before saving
        static::saving(function ($transaction) {
            if (!PointTransactionType::isValid($transaction->type)) {
                throw new \InvalidArgumentException(
                    "Invalid transaction type: {$transaction->type}. " .
                    "Valid types are: " . implode(', ', PointTransactionType::values())
                );
            }
        });
    }

    /**
     * Get all valid transaction types
     */
    public static function getValidTypes(): array
    {
        return PointTransactionType::values();
    }

    /**
     * Check if a type is valid
     */
    public static function isValidType(string $type): bool
    {
        return PointTransactionType::isValid($type);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get human-readable type name in Arabic
     */
    public function getTypeNameAttribute(): string
    {
        // Try to use enum label, fallback to old match for backward compatibility
        try {
            return PointTransactionType::from($this->type)->label();
        } catch (\ValueError) {
            // Fallback for any custom types not in enum
            return $this->type;
        }
    }

    /**
     * Scope for filtering by type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope for this week's transactions
     */
    public function scopeThisWeek($query)
    {
        return $query->where('created_at', '>=', now()->startOfWeek());
    }

    /**
     * Scope for this month's transactions
     */
    public function scopeThisMonth($query)
    {
        return $query->where('created_at', '>=', now()->startOfMonth());
    }
}
