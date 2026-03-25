<?php

declare(strict_types=1);

namespace App\Domains\Exams\Models;

use App\Domains\Auth\Models\Student;
use App\Domains\Exams\Enums\ExamAttemptStatus;
use App\Domains\Application\Services\CacheService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ExamAttempt extends Model
{
    use HasUuids;

    protected $fillable = [
        'exam_id',
        'student_id',
        'started_at',
        'completed_at',
        'questions_order',
        'current_question_index',
        'terminated_reason',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'questions_order' => 'array',
            'status' => ExamAttemptStatus::class,
        ];
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(StudentAnswer::class);
    }

    public function result(): HasOne
    {
        return $this->hasOne(ExamResult::class, 'attempt_id');
    }

    /**
     * Get the current question based on index
     */
    public function getCurrentQuestion()
    {
        $questionIds = $this->questions_order;
        if ($this->current_question_index >= count($questionIds)) {
            return null;
        }
        $questionId = $questionIds[$this->current_question_index];
        
        return CacheService::getExamAttemptCurrentQuestion($this->id, function () use ($questionId) {
            return Question::find($questionId);
        });
    }

    /**
     * Check if all questions have been answered
     */
    public function isComplete(): bool
    {
        return $this->current_question_index >= count($this->questions_order);
    }

    /**
     * Get total questions count
     */
    public function getTotalQuestionsCount(): int
    {
        return count($this->questions_order);
    }

    /**
     * Get answered questions count
     * Note: Use loadCount() instead of count() to avoid N+1 queries
     */
    public function getAnsweredQuestionsCount(): int
    {
        return $this->answers_count ?? $this->loadCount('answers');
    }

    protected static function booted()
    {
        static::updated(function ($attempt) {
            if ($attempt->isDirty('current_question_index')) {
                CacheService::forgetExamAttemptCurrentQuestion($attempt->id);
            }
        });
    }
}
