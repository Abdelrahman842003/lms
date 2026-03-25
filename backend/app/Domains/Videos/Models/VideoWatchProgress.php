<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use App\Domains\Auth\Models\Student;
use App\Domains\Videos\Enums\VideoWatchStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoWatchProgress extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'video_watch_progresses';

    protected $fillable = [
        'video_id',
        'student_id',
        'started_at',
        'last_watched_at',
        'completed_at',
        'watched_seconds',
        'watched_percentage',
        'last_position_seconds',
        'last_playback_token_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => VideoWatchStatus::class,
            'started_at' => 'datetime',
            'last_watched_at' => 'datetime',
            'completed_at' => 'datetime',
            'watched_seconds' => 'integer',
            'watched_percentage' => 'decimal:2',
            'last_position_seconds' => 'integer',
        ];
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
