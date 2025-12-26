<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Spatie\Permission\Traits\HasRoles;
use App\Traits\HasDeviceTokens;

class Secretary extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasUuids, HasRoles, HasDeviceTokens;

    protected $fillable = [
        'teacher_id',
        'name',
        'phone',
        'password',
        'permissions',
        'avatar_key',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'permissions' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'secretary_teacher')
            ->withPivot('permissions')
            ->withTimestamps();
    }

    public function scopeFilter($query, array $filters)
    {
        if ($search = $filters['search'] ?? null) {
            $query->where('name', 'like', "%{$search}%");
        }

        if (($status = $filters['status'] ?? null) !== null && $status !== '') {
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }
    }
}
