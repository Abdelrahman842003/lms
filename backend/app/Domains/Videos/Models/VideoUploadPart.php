<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoUploadPart extends Model
{
    use HasUuids;

    protected $fillable = [
        'session_id',
        'part_number',
        'size_bytes',
        'status',
        'etag',
        'upload_attempts',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(VideoUploadSession::class, 'session_id');
    }
}
