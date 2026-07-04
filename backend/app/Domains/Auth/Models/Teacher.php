<?php

declare(strict_types=1);

namespace App\Domains\Auth\Models;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Auth\Models\Student;
use App\Domains\Subscriptions\Models\TeacherSubscription;
use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Subscriptions\Models\PaymentTransaction;
use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Auth\Models\Academy;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Application\Traits\HasDeviceTokens;
use App\Domains\Subscriptions\Traits\HasSubscriptionStatus;
use App\Domains\Subscriptions\Traits\HasTenantPlan;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Teacher extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasUuids, HasDeviceTokens, HasSubscriptionStatus, HasTenantPlan, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'phone', 'subject', 'status', 'plan_type', 'plan_expires_at'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected static function newFactory()
    {
        return \Database\Factories\TeacherFactory::new();
    }

    protected $connection = 'mysql'; // Central DB

    public function getConnectionName()
    {
        return app()->runningUnitTests() ? config('database.default') : $this->connection;
    }

    protected $fillable = [
        'name',
        'phone',
        'subject',
        'avatar_key',
        'custom_expires_at',
        'password',
        'status',
        'is_independent_active',
        'has_videos_addon',
        // Plan fields handled by HasTenantPlan trait
        'trial_period_days', 'plan_type', 'subscription_period', 'plan_expires_at',
        'plan_max_students', 'is_unlimited_students', 'subscription_fee',
        'discount_percent', 'discount_type', 'discount_scope', 'billing_notes'
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
            'has_videos_addon' => 'boolean',
            'custom_expires_at' => 'date',
            'status' => \App\Domains\Auth\Enums\TeacherStatus::class,
            'plan_expires_at' => 'date',
            'is_unlimited_students' => 'boolean',
            'subscription_fee' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'discount_percent' => 'decimal:2',
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

    /**
     * Get all workspaces / profiles for this teacher.
     */
    public function profiles()
    {
        return $this->hasMany(TeacherProfile::class, 'teacher_id');
    }

    /**
     * Get all enrollments across all profiles.
     */
    public function enrollments()
    {
        return $this->hasManyThrough(
            \App\Domains\Enrollments\Models\Enrollment::class,
            TeacherProfile::class,
            'teacher_id',
            'teacher_profile_id',
            'id',
            'id'
        );
    }

    /**
     * Get active enrollments across all profiles.
     */
    public function activeEnrollments()
    {
        return $this->enrollments()->where('enrollments.is_active', true);
    }

    /**
     * Get grades across all profiles.
     */
    public function grades()
    {
        return $this->hasManyThrough(
            \App\Domains\Enrollments\Models\Grade::class,
            TeacherProfile::class,
            'teacher_id',
            'teacher_profile_id',
            'id',
            'id'
        );
    }

    /**
     * Get groups across all profiles.
     */
    public function groups()
    {
        return $this->hasManyThrough(
            \App\Domains\Enrollments\Models\Group::class,
            TeacherProfile::class,
            'teacher_id',
            'teacher_profile_id',
            'id',
            'id'
        );
    }

    /**
     * Get lectures across all profiles.
     */
    public function lectures()
    {
        return $this->hasManyThrough(
            \App\Domains\Lectures\Models\Lecture::class,
            TeacherProfile::class,
            'teacher_id',
            'teacher_profile_id',
            'id',
            'id'
        );
    }

    /**
     * Get exams across all profiles.
     */
    public function exams()
    {
        return $this->hasManyThrough(
            \App\Domains\Exams\Models\Exam::class,
            TeacherProfile::class,
            'teacher_id',
            'teacher_profile_id',
            'id',
            'id'
        );
    }

    /**
     * Get questions across all profiles.
     */
    public function questions()
    {
        return $this->hasManyThrough(
            \App\Domains\Exams\Models\Question::class,
            TeacherProfile::class,
            'teacher_id',
            'teacher_profile_id',
            'id',
            'id'
        );
    }

    /**
     * Get payment logs across all profiles.
     */
    public function paymentLogs()
    {
        return $this->hasManyThrough(
            \App\Domains\Subscriptions\Models\PaymentLog::class,
            TeacherProfile::class,
            'teacher_id',
            'teacher_profile_id',
            'id',
            'id'
        );
    }

    /**
     * Get students enrolled in any of this teacher's profiles.
     */
    public function students()
    {
        $pivotTable = '(select enrollments.*, teacher_profiles.teacher_id from enrollments join teacher_profiles on enrollments.teacher_profile_id = teacher_profiles.id where enrollments.deleted_at is null) as enrollments';
        
        $query = $this->newRelatedInstance(Student::class)->newQuery();
        
        return new class($query, $this, $pivotTable, 'teacher_id', 'student_id', 'id', 'id', 'students') extends \Illuminate\Database\Eloquent\Relations\BelongsToMany {
            protected function resolveTableName($table)
            {
                return new \Illuminate\Database\Query\Expression($table);
            }

            public function qualifyPivotColumn($column)
            {
                if ($this->query->getQuery()->getGrammar()->isExpression($column)) {
                    return $column;
                }

                return str_contains($column, '.')
                    ? $column
                    : 'enrollments.'.$column;
            }
        };
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

    /**
     * Payment transactions (polymorphic)
     */
    public function paymentTransactions()
    {
        return $this->morphMany(PaymentTransaction::class, 'payer');
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
                ->orWhereHas('tenantPlan', function ($tpQuery) {
                    $tpQuery->where('plan_expires_at', '>=', now()->startOfDay());
                });
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
     * Check if teacher has any active academy connections
     */
    public function hasActiveAcademies(): bool
    {
        return $this->activeAcademies()->exists();
    }

    /**
     * Check if teacher access is restricted based on independent status and academy connections
     */
    public function isAccessRestricted(): bool
    {
        // If independent is active, they are not restricted
        if ($this->is_independent_active) {
            return false;
        }

        // If they have at least one active academy connection, they are not restricted
        if ($this->hasActiveAcademies()) {
            return false;
        }

        return true;
    }

    public function receivesBroadcastNotificationsOn(): string
    {
        return 'notifications.teacher.' . $this->id;
    }
}
