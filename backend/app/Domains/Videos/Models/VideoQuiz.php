<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use App\Domains\Auth\Models\Teacher;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VideoQuiz extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'video_id',
        'teacher_id',
        'title',
        'passing_score',
        'is_required',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'passing_score' => 'integer',
            'is_required'   => 'boolean',
            'is_active'     => 'boolean',
        ];
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(VideoQuizQuestion::class)->orderBy('sort_order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(VideoQuizAttempt::class);
    }

    /**
     * هل الطالب عدى هذا التدريب من قبل؟
     */
    public function passedByStudent(string $studentId): bool
    {
        return $this->attempts()
            ->where('student_id', $studentId)
            ->where('status', 'passed')
            ->exists();
    }
}
