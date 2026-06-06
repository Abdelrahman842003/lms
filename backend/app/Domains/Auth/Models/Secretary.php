<?php

declare(strict_types=1);

namespace App\Domains\Auth\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Spatie\Permission\Traits\HasRoles;
use App\Domains\Application\Traits\HasDeviceTokens;
use App\Domains\Support\Traits\UsesTeacherProfileScope;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Secretary extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasUuids, HasRoles, HasDeviceTokens, LogsActivity, UsesTeacherProfileScope;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'phone', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected static function newFactory()
    {
        return \Database\Factories\SecretaryFactory::new();
    }

    protected $fillable = [
        'name',
        'phone',
        'avatar_key',
        'password',
        'is_active',
        'teacher_profile_id',
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
        return $this->belongsToMany(TeacherProfile::class, 'secretary_teacher', 'secretary_id', 'teacher_profile_id')
            ->withPivot('permissions')
            ->withTimestamps();
    }

    /**
     * Academies this secretary manages
     */
    public function academies()
    {
        return $this->belongsToMany(Academy::class, 'academy_secretary')
            ->withPivot('permissions', 'is_active')
            ->withTimestamps();
    }

    /**
     * Active academies
     */
    public function activeAcademies()
    {
        return $this->academies()->wherePivot('is_active', true);
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
