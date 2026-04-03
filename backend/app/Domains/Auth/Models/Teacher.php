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
use App\Domains\Application\Models\TeacherAttendanceLog;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Application\Traits\HasDeviceTokens;
use App\Domains\Subscriptions\Traits\HasSubscriptionStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Teacher extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasUuids, HasDeviceTokens, HasSubscriptionStatus;

    protected static function newFactory()
    {
        return \Database\Factories\TeacherFactory::new();
    }

    protected $connection = 'mysql'; // Central DB

    protected $fillable = [
        'name',
        'phone',
        'subject',
        'avatar_key',
        'subscription_period',
        'custom_expires_at',
        'password',
        'status',
        'plan_type',
        'plan_expires_at',
        'plan_max_students',
        'is_unlimited_students',
        'storage_limit_gb',
        'storage_used_bytes',
        'discount_percent',
        'discount_type',
        'discount_scope',
        'is_independent_active',
        'trial_period_days',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['avatar_url'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_independent_active' => 'boolean',
            'trial_period_days' => 'integer',
            'is_unlimited_students' => 'boolean',
            'plan_expires_at' => 'date',
            'custom_expires_at' => 'date',
            'status' => \App\Domains\Auth\Enums\TeacherStatus::class,
            'storage_limit_gb' => 'integer',
            'storage_used_bytes' => 'integer',
            'discount_percent' => 'decimal:2',
            'discount_type' => 'string',
            'discount_scope' => 'string',
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

    /**
     * Get the full avatar URL from R2 storage.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar_key) {
            return null;
        }

        $baseUrl = rtrim(config('filesystems.disks.r2.url'), '/');
        $key = ltrim($this->avatar_key, '/');

        return $baseUrl . '/' . $key;
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

    public function latestSubscription()
    {
        return $this->morphOne(Subscription::class, 'subscriber')
            ->orderByDesc('month')
            ->orderByDesc('created_at');
    }

    public function isSubscriptionBlocked(): bool
    {
        // Active personal subscription → not blocked
        if ($this->hasActiveSubscription()) {
            return false;
        }

        // Check if any active academy has active subscription (DB-level check)
        $activeAcademyWithSubscription = $this->academies()
            ->wherePivot('is_active', true)
            ->where(function ($query) {
                $query->whereHas('subscriptions', function ($subQuery) {
                    $subQuery->where('status', \App\Domains\Subscriptions\Enums\SubscriptionStatus::PAID->value)
                        ->where('month', '>=', now()->startOfMonth()->toDateString());
                })
                ->orWhere('plan_expires_at', '>=', now()->startOfDay());
            })
            ->exists();

        return ! $activeAcademyWithSubscription;
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
