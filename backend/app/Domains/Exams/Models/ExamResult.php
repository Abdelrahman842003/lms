<?php

declare(strict_types=1);

namespace App\Domains\Exams\Models;

use App\Domains\Auth\Models\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamResult extends Model
{
    use HasUuids;

    protected $fillable = [
        'exam_id',
        'student_id',
        'score',
        'percentage',
        'attempt_id',
    ];

    protected function casts(): array
    {
        return [
            'percentage' => 'decimal:2',
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

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }

    // Removed problematic relationship - using direct query in Resource instead
}
