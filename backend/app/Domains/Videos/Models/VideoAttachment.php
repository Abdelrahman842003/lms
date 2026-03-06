<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class VideoAttachment extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'video_id',
        'title',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
        'uploaded_by_type',
        'uploaded_by_id',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
        ];
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    public function uploader(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'uploaded_by_type', 'uploaded_by_id');
    }
}
