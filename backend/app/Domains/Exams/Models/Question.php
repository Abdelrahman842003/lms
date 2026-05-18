<?php

declare(strict_types=1);

namespace App\Domains\Exams\Models;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Exams\Enums\QuestionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Question extends Model
{
    use HasUuids;

    protected $fillable = [
        'exam_id', // Kept for backward compatibility
        'teacher_id',
        'grade_id',
        'subject',
        'text',
        'type',
        'difficulty',
        'options',
        'correct_answer',
        'duration',
        'tags',
        'usage_count',
        'correct_answers_count',
        'total_answers_count',
        'average_time',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'tags' => 'array',
            'type' => QuestionType::class,
        ];
    }

    public function exam(): BelongsTo
    {
        // Legacy relationship
        return $this->belongsTo(Exam::class);
    }

    public function exams(): BelongsToMany
    {
        return $this->belongsToMany(Exam::class, 'exam_question')
            ->withPivot(['order', 'points'])
            ->withTimestamps();
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(\App\Domains\Enrollments\Models\Grade::class);
    }
}
