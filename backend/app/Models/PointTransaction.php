<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PointTransaction extends Model
{
    use HasUuids;

    // Transaction types
    const TYPE_ATTENDANCE = 'attendance';
    const TYPE_PERFECT_MONTH = 'perfect_month';
    const TYPE_EXAM_SCORE = 'exam_score';
    const TYPE_EXAM_RETAKE_BONUS = 'exam_retake_bonus';
    const TYPE_EXAM_FIRST_PLACE = 'exam_first_place';
    const TYPE_STREAK_5 = 'streak_5';
    const TYPE_STREAK_10 = 'streak_10';
    const TYPE_MANUAL_BONUS = 'manual_bonus';

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
        return match ($this->type) {
            self::TYPE_ATTENDANCE => 'حضور الحصة',
            self::TYPE_PERFECT_MONTH => 'حضور شهر كامل',
            self::TYPE_EXAM_SCORE => 'درجة الامتحان',
            self::TYPE_EXAM_RETAKE_BONUS => 'بونص إعادة الامتحان',
            self::TYPE_EXAM_FIRST_PLACE => 'أول الدفعة',
            self::TYPE_STREAK_5 => 'سلسلة 5 حصص',
            self::TYPE_STREAK_10 => 'سلسلة 10 حصص',
            self::TYPE_MANUAL_BONUS => 'بونص من المدرس',
            default => $this->type,
        };
    }

    protected $appends = ['type_name'];

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
