<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Exam extends Model
{
    use HasFactory, HasUuids;

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
        'is_active',
        'activated_at',
        'ended_at',
    ];

    protected $casts = [
        'date' => 'datetime',
        'is_active' => 'boolean',
        'activated_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function attempts()
    {
        return $this->hasMany(ExamAttempt::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function results()
    {
        return $this->hasMany(ExamResult::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }
    public function scopeFilter($query, array $filters)
    {
        if ($search = $filters['search'] ?? null) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        if ($dateFrom = $filters['date_from'] ?? null) {
            $query->whereDate('date', '>=', $dateFrom);
        }

        if ($dateTo = $filters['date_to'] ?? null) {
            $query->whereDate('date', '<=', $dateTo);
        }
    }
}
