<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use App\Domains\Videos\Enums\VideoUploadSessionStatus;
use App\Domains\Support\Traits\GuardsSensitiveFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class VideoUploadSession extends Model
{
    use GuardsSensitiveFields;
    use HasUuids;

    protected $fillable = [
        'video_id',
        'uploader_type',
        'uploader_id',
        'r2_upload_id',
        'object_key',
        'declared_filename',
        'declared_mime',
        'declared_size_bytes',
        'total_parts',
        'initiated_at',
        'completed_at',
        'aborted_at',
        'abort_reason',
        'initiator_ip',
    ];

    protected function casts(): array
    {
        return [
            'status'             => VideoUploadSessionStatus::class,
            'declared_size_bytes' => 'integer',
            'total_parts'        => 'integer',
            'initiated_at'       => 'datetime',
            'completed_at'       => 'datetime',
            'aborted_at'         => 'datetime',
        ];
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    public function uploader(): MorphTo
    {
        return $this->morphTo('uploader');
    }

    public function isOwnedBy(string $uploaderType, string $uploaderId): bool
    {
        return $this->uploader_type === $uploaderType
            && (string) $this->uploader_id === $uploaderId;
    }
}
