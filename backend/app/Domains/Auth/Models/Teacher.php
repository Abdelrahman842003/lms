<?php

declare(strict_types=1);

namespace App\Domains\Auth\Models;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Auth\Models\Student;
use App\Domains\Subscriptions\Models\TeacherSubscription;
use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Auth\Models\Academy;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Support\Models\TeacherAttendanceLog;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Support\Traits\HasDeviceTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Teacher extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasUuids, HasDeviceTokens;

    protected static function newFactory()
    {
        return \Database\Factories\TeacherFactory::new();
    }

    protected $connection = 'mysql'; // Central DB

    protected $fillable = [
        'name',
        'phone',
        'subject',
        'password',
        'avatar_key',
        'status',
        'subscription_fee',
        'paid_amount',
        'is_independent_active',
        'plan_type',
        'plan_expires_at',
        'subscription_period',
        'custom_expires_at',
        'plan_max_students',
        'is_unlimited_students',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_independent_active' => 'boolean',
            'is_unlimited_students' => 'boolean',
            'plan_expires_at' => 'date',
            'custom_expires_at' => 'date',
            'status' => \App\Domains\Auth\Enums\TeacherStatus::class,
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
            ->withPivot(['grade_id', 'group_id', 'balance', 'is_active', 'subscription_start', 'subscription_end', 'teacher_notes', 'academy_id'])
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
    /**
     * Old subscriptions (for backward compatibility)
     * @deprecated Use morph subscriptions instead
     */
    public function teacherSubscriptions()
    {
        return $this->hasMany(TeacherSubscription::class);
    }

    /**
     * Unified subscriptions (polymorphic)
     */
    public function subscriptions()
    {
        return $this->morphMany(Subscription::class, 'subscriber');
    }

    public function latestSubscription(): ?Subscription
    {
        return $this->subscriptions()
            ->orderByDesc('month')
            ->orderByDesc('created_at')
            ->first();
    }

    public function hasActiveSubscription(): bool
    {
        $latest = $this->latestSubscription();
        if ($latest) {
            $status = $latest->status instanceof SubscriptionStatus ? $latest->status->value : (string) $latest->status;
            if (in_array($status, [
                SubscriptionStatus::CANCELLED->value,
                SubscriptionStatus::PENDING->value,
                SubscriptionStatus::PARTIAL->value,
                SubscriptionStatus::EXPIRED->value,
            ], true)) {
                return false;
            }
        }

        $expiresAt = $this->plan_expires_at ? $this->plan_expires_at->copy()->startOfDay() : null;
        if ($this->plan_type === 'trial') {
            return $expiresAt !== null && $expiresAt->gte(now()->startOfDay());
        }

        return $expiresAt !== null && $expiresAt->gte(now()->startOfDay());
    }

    public function isSubscriptionBlocked(): bool
    {
        return ! $this->hasActiveSubscription();
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
