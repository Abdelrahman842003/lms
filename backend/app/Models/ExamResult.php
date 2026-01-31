<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

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

    protected $casts = [
        'percentage' => 'decimal:2',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function attempt()
    {
        return $this->belongsTo(ExamAttempt::class, 'attempt_id');
    }

    // Removed problematic relationship - using direct query in Resource instead
}
