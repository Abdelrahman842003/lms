<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginAttempt extends Model
{
    protected $fillable = [
        'identifier',
        'ip_address',
        'attempts',
        'ban_level',
        'banned_until',
    ];

    protected $casts = [
        'banned_until' => 'datetime',
        'attempts' => 'integer',
        'ban_level' => 'integer',
    ];
}
