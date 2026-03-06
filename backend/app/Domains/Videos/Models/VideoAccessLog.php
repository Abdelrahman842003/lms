<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use Illuminate\Database\Eloquent\Model;

class VideoAccessLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'video_id',
        'student_id',
        'action',
        'result',
        'reason',
        'device_fingerprint',
        'session_identifier',
        'user_agent_hash',
        'ip_address',
        'meta',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
