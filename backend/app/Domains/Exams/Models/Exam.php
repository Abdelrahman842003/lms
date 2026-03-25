<?php

declare(strict_types=1);

namespace App\Domains\Exams\Models;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Exam extends Model
{
    use HasFactory, HasUuids;

    protected static function newFactory()
    {
        return \Database\Factories\ExamFactory::new();
    }

    protected $fillable = [
        'teacher_id',
        'academy_id',
        'title',
        'subject',
        'max_score',
        'date',
        'duration',
        'grade_id',
        'group_id',
        'actual_question_count',
        'time_per_question',
        'activated_at',
        'ended_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'is_active' => 'boolean',
            'activated_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(ExamAttempt::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(ExamResult::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    // Note: Filtering logic moved to \App\Domains\Application\Filters\ExamFilter
}
