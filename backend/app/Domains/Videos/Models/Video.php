<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Videos\Enums\VideoOwnerType;
use App\Domains\Videos\Enums\VideoProcessingStatus;
use App\Domains\Videos\Enums\VideoStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Video extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'owner_type',
        'owner_id',
        'uploader_type',
        'uploader_id',
        'teacher_reference_id',
        'teacher_reference_name',
        'academy_id',
        'grade_id',
        'lecture_id',
        'lesson_id',
        'title',
        'description',
        'status',
        'processing_status',
        'scheduled_at',
        'published_at',
        'available_from',
        'available_until',
        'original_path',
        'processed_path',
        'thumbnail_path',
        'video_mime',
        'video_size_bytes',
        'duration_seconds',
        'width',
        'height',
        'codec',
        'frame_rate',
        'published_by_type',
        'published_by_id',
        'processing_error',
    ];

    protected function casts(): array
    {
        return [
            'owner_type' => VideoOwnerType::class,
            'status' => VideoStatus::class,
            'processing_status' => VideoProcessingStatus::class,
            'scheduled_at' => 'datetime',
            'published_at' => 'datetime',
            'available_from' => 'datetime',
            'available_until' => 'datetime',
            'video_size_bytes' => 'integer',
            'duration_seconds' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'frame_rate' => 'decimal:3',
        ];
    }

    public function owner(): MorphTo
    {
        return $this->morphTo();
    }

    public function uploader(): MorphTo
    {
        return $this->morphTo();
    }

    public function publishedBy(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'published_by_type', 'published_by_id');
    }

    public function teacherReference(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_reference_id');
    }

    public function academy(): BelongsTo
    {
        return $this->belongsTo(Academy::class);
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    public function lecture(): BelongsTo
    {
        return $this->belongsTo(Lecture::class);
    }

    public function groupTargets(): HasMany
    {
        return $this->hasMany(VideoGroupTarget::class);
    }

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'video_group_targets')
            ->using(VideoGroupTarget::class)
            ->withTimestamps();
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(VideoAttachment::class);
    }

    public function accessGrants(): HasMany
    {
        return $this->hasMany(VideoAccessGrant::class);
    }

    public function watchProgresses(): HasMany
    {
        return $this->hasMany(VideoWatchProgress::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(VideoLike::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(VideoComment::class)->whereNull('parent_id');
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(VideoReminder::class);
    }

    public function playbackTokens(): HasMany
    {
        return $this->hasMany(VideoPlaybackToken::class);
    }

    public function quiz(): HasOne
    {
        return $this->hasOne(VideoQuiz::class);
    }

    public function scopePublishedNow($query)
    {
        return $query
            ->where('status', VideoStatus::PUBLISHED->value)
            ->where(function ($q) {
                $q->whereNull('available_from')
                    ->orWhere('available_from', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('available_until')
                    ->orWhere('available_until', '>=', now());
            });
    }
}
