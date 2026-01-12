<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\HasDeviceTokens;

class Teacher extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasUuids, HasDeviceTokens;

    protected $connection = 'mysql'; // Central DB

    protected $fillable = [
        'name',
        'phone',
        'password',
        'avatar_key',
        'status',
        'subscription_fee',
        'paid_amount',
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

    // Accessors for backward compatibility
    public function getIsApprovedAttribute(): bool
    {
        return $this->status !== 'pending';
    }

    public function getIsSuspendedAttribute(): bool
    {
        return $this->status === 'suspended';
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'active';
    }

    // Many-to-Many Relationships via Enrollment
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'enrollments')
            ->withPivot(['grade_id', 'group_id', 'balance', 'is_active', 'subscription_start', 'subscription_end', 'teacher_notes'])
            ->withTimestamps();
    }

    public function activeEnrollments()
    {
        return $this->enrollments()->where('is_active', true);
    }

    public function activeStudents()
    {
        return $this->students()->wherePivot('is_active', true);
    }

    // Get enrollment for specific student
    public function enrollmentFor(Student $student): ?Enrollment
    {
        return $this->enrollments()->where('student_id', $student->id)->first();
    }

    public function secretaries()
    {
        return $this->belongsToMany(Secretary::class, 'secretary_teacher')
            ->withPivot('permissions')
            ->withTimestamps();
    }

    public function lectures()
    {
        return $this->hasMany(Lecture::class);
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    public function groups()
    {
        return $this->hasMany(Group::class);
    }
    public function scopeFilter($query, array $filters)
    {
        if ($search = $filters['search'] ?? null) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($dateFrom = $filters['date_from'] ?? null) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $filters['date_to'] ?? null) {
            $query->whereDate('created_at', '<=', $dateTo);
        }
    }
    public function subscriptions()
    {
        return $this->hasMany(TeacherSubscription::class);
    }

    /**
     * Academies this teacher belongs to
     */
    public function academies()
    {
        return $this->belongsToMany(Academy::class, 'academy_teacher')
            ->withPivot('is_active', 'joined_at')
            ->withTimestamps();
    }

    /**
     * Active academies
     */
    public function activeAcademies()
    {
        return $this->academies()->wherePivot('is_active', true);
    }

    /**
     * Attendance logs for this teacher
     */
    public function attendanceLogs()
    {
        return $this->hasMany(TeacherAttendanceLog::class);
    }

    public function receivesBroadcastNotificationsOn(): string
    {
        return 'notifications.teacher.' . $this->id;
    }
}
