<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

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
        'status',
        'terminated_reason',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'questions_order' => 'array',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function answers()
    {
        return $this->hasMany(StudentAnswer::class);
    }

    public function result()
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
        return Question::find($questionId);
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
     */
    public function getAnsweredQuestionsCount(): int
    {
        return $this->answers()->count();
    }
}
