<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoQuizQuestion extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'video_quiz_id',
        'text',
        'options',
        'correct_answer',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'options'    => 'array',
            'sort_order' => 'integer',
        ];
    }

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(VideoQuiz::class, 'video_quiz_id');
    }
}
