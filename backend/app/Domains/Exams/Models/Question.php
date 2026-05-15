<?php

declare(strict_types=1);

namespace App\Domains\Exams\Models;

use App\Domains\Exams\Enums\QuestionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Question extends Model
{
    use HasUuids;

    protected $fillable = [
        'exam_id',
        'text',
        'type',
        'options',
        'correct_answer',
        'duration',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'type' => QuestionType::class,
        ];
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
}
