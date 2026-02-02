<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class DeviceToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'token',
        'tokenable_id',
        'tokenable_type',
        'device_type',
        'last_used_at',
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
        'device_type' => \App\Enums\DeviceType::class,
    ];

    /**
     * Get the owning tokenable model.
     */
    public function tokenable(): MorphTo
    {
        return $this->morphTo();
    }
}
