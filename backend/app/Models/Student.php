<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Spatie\Permission\Traits\HasRoles;
use App\Traits\HasDeviceTokens;

class Student extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasUuids, HasRoles, HasDeviceTokens;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'password',
        'avatar_key',
        'phone',
        'parent_phone',
        'gender',
        'education_type',
        'location',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    // Many-to-Many Relationships via Enrollment
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'enrollments')
            ->withPivot(['grade_id', 'group_id', 'balance', 'is_active', 'subscription_start', 'subscription_end', 'teacher_notes'])
            ->withTimestamps();
    }

    public function activeEnrollments()
    {
        return $this->enrollments()->where('is_active', true);
    }

    // Get enrollment for specific teacher
    public function enrollmentFor(Teacher $teacher): ?Enrollment
    {
        return $this->enrollments()->where('teacher_id', $teacher->id)->first();
    }

    // Kept for backward compatibility - will get grade from enrollment
    public function getGradeForTeacher(Teacher $teacher): ?Grade
    {
        $enrollment = $this->enrollmentFor($teacher);
        return $enrollment?->grade;
    }

    public function getGroupForTeacher(Teacher $teacher): ?Group
    {
        $enrollment = $this->enrollmentFor($teacher);
        return $enrollment?->group;
    }

    public function getBalanceForTeacher(Teacher $teacher): float
    {
        $enrollment = $this->enrollmentFor($teacher);
        return $enrollment?->balance ?? 0;
    }

    public function examResults()
    {
        return $this->hasMany(ExamResult::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(StudentActivityLog::class);
    }

    public function scopeFilter($query, array $filters)
    {
        if ($search = $filters['search'] ?? null) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }
    }

    // Search by phone for enrollment
    public static function findByPhone(string $phone): ?self
    {
        return self::where('phone', $phone)->first();
    }
}
