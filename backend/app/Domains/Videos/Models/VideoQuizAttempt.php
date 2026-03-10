<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use App\Domains\Auth\Models\Student;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoQuizAttempt extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'video_quiz_id',
        'student_id',
        'correct_count',
        'total_count',
        'percentage',
        'status',
        'answers',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'correct_count' => 'integer',
            'total_count'   => 'integer',
            'percentage'    => 'decimal:2',
            'answers'       => 'array',
            'completed_at'  => 'datetime',
        ];
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(VideoQuiz::class, 'video_quiz_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function isPassed(): bool
    {
        return $this->status === 'passed';
    }
}
