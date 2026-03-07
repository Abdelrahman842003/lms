<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use App\Domains\Enrollments\Models\Group;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class VideoGroupTarget extends Pivot
{
    use HasFactory;
    use HasUuids;

    public $incrementing = false;

    protected $fillable = [
        'video_id',
        'group_id',
    ];

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }
}
