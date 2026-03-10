<?php

declare(strict_types=1);

namespace App\Domains\Auth\Models;

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

    protected function casts(): array
    {
        return [
            'banned_until' => 'datetime',
            'attempts' => 'integer',
            'ban_level' => 'integer',
        ];
    }
}
