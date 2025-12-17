<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FailedQuestion extends Model
{
    use HasUuids;

    protected $table = 'student_failed_questions';

    protected $fillable = [
        'student_id',
        'teacher_id',
        'question_id',
        'exam_id',
        'student_answer',
        'times_failed',
        'is_mastered',
        'mastered_at',
    ];

    protected $casts = [
        'times_failed' => 'integer',
        'is_mastered' => 'boolean',
        'mastered_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /**
     * Scope for unmastered questions only
     */
    public function scopeUnmastered($query)
    {
        return $query->where('is_mastered', false);
    }

    /**
     * Scope for specific teacher
     */
    public function scopeForTeacher($query, string $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    /**
     * Mark as mastered
     */
    public function markAsMastered(): void
    {
        $this->update([
            'is_mastered' => true,
            'mastered_at' => now(),
        ]);
    }

    /**
     * Increment times failed
     */
    public function incrementFailed(?string $answer = null): void
    {
        $this->increment('times_failed');
        if ($answer) {
            $this->update(['student_answer' => $answer]);
        }
    }
}
