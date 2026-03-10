<?php

declare(strict_types=1);

namespace App\Domains\Exams\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Question extends Model
{
    use HasUuids;

    protected $fillable = [
        'exam_id',
        'text',
        'options',
        'correct_answer',
        'duration',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
        ];
    }

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
}
