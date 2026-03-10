<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use App\Domains\Auth\Models\Student;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoPlaybackToken extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'video_id',
        'student_id',
        'device_fingerprint',
        'session_identifier',
        'user_agent_hash',
        'ip_address',
        'token_hash',
        'expires_at',
        'issued_at',
        'last_used_at',
        'revoked_at',
        'revoked_reason',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'issued_at' => 'datetime',
            'last_used_at' => 'datetime',
            'revoked_at' => 'datetime',
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

    public function scopeActive($query)
    {
        return $query
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now());
    }
}
