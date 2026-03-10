<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\Student;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoReminder extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'video_id',
        'student_id',
        'guardian_id',
        'attempts',
        'next_reminder_at',
        'last_reminded_at',
        'stopped_at',
        'stop_reason',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'next_reminder_at' => 'datetime',
            'last_reminded_at' => 'datetime',
            'stopped_at' => 'datetime',
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

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(Guardian::class);
    }

    public function scopePending($query)
    {
        return $query
            ->whereNull('stopped_at')
            ->whereNotNull('next_reminder_at')
            ->where('next_reminder_at', '<=', now());
    }
}
