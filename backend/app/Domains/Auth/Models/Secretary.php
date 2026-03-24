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
use App\Domains\Application\Traits\GuardsSensitiveFields;
use App\Domains\Auth\Models\Academy;

class Secretary extends Authenticatable
{
    use GuardsSensitiveFields;
    use HasFactory, Notifiable, HasApiTokens, HasUuids, HasRoles, HasDeviceTokens;

    protected static function newFactory()
    {
        return \Database\Factories\SecretaryFactory::new();
    }

    /**
     * Sensitive fields that should never be mass-assignable.
     * These are in addition to the default sensitive fields in GuardsSensitiveFields trait.
     *
     * @var array<int, string>
     */
    protected array $customSensitiveFields = [
        'teacher_id',
    ];

    protected $fillable = [
        'name',
        'phone',
        'avatar_key',
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
