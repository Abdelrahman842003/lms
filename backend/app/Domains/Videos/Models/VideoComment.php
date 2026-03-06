<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class VideoComment extends Model
{
    use HasFactory;
    use HasUuids;
    use SoftDeletes;

    protected $fillable = [
        'video_id',
        'parent_id',
        'author_type',
        'author_id',
        'body',
        'is_hidden',
        'hidden_by_type',
        'hidden_by_id',
        'hidden_at',
    ];

    protected function casts(): array
    {
        return [
            'is_hidden' => 'boolean',
            'hidden_at' => 'datetime',
        ];
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    public function author(): MorphTo
    {
        return $this->morphTo();
    }

    public function hiddenBy(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'hidden_by_type', 'hidden_by_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }
}
