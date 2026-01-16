<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Auth\Authenticatable;

class Academy extends Model implements AuthenticatableContract
{
    use HasFactory, HasUuids, HasApiTokens, Authenticatable;

    protected $fillable = [
        'name',
        'phone',
        'password',
        'logo_key',
        'is_active',
        'billing_notes',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($academy) {
            // Generate unique QR codes
            $academy->checkin_qr_code = Str::random(32);
            $academy->checkout_qr_code = Str::random(32);
        });
    }

    /**
     * Secretaries managing this academy
     */
    public function secretaries()
    {
        return $this->belongsToMany(Secretary::class, 'academy_secretary')
            ->withPivot('permissions', 'is_active')
            ->withTimestamps();
    }

    /**
     * Active secretaries
     */
    public function activeSecretaries()
    {
        return $this->secretaries()->wherePivot('is_active', true);
    }

    /**
     * Teachers in this academy
     */
    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'academy_teacher')
            ->withPivot('is_active', 'joined_at')
            ->withTimestamps();
    }

    /**
     * Active teachers
     */
    public function activeTeachers()
    {
        return $this->teachers()
            ->wherePivot('is_active', true)
            ->where('teachers.status', 'active');
    }

    /**
     * Billings for this academy
     */
    public function billings()
    {
        return $this->hasMany(AcademyBilling::class);
    }

    /**
     * Attendance logs
     */
    public function attendanceLogs()
    {
        return $this->hasMany(TeacherAttendanceLog::class);
    }

    /**
     * Get total students count across all teachers
     */
    public function getTotalStudentsCountAttribute()
    {
        return $this->activeTeachers()
            ->get()
            ->sum(function ($teacher) {
                return $teacher->activeEnrollments()->count();
            });
    }

    /**
     * Scope for active academies
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for filtering
     */
    public function scopeFilter($query, array $filters)
    {
        if ($search = $filters['search'] ?? null) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
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
