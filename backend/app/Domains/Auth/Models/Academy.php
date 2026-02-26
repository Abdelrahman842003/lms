<?php

declare(strict_types=1);

namespace App\Domains\Auth\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Auth\Authenticatable;
use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Subscriptions\Models\AcademySubscription;
use App\Domains\Support\Models\TeacherAttendanceLog;

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
        'subscription_fee',
        'paid_amount',
        'plan_type',
        'plan_expires_at',
        'plan_max_students',
        'is_unlimited_students',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'password' => 'hashed',
        'plan_expires_at' => 'date',
        'plan_max_students' => 'integer',
        'is_unlimited_students' => 'boolean',
        'subscription_fee' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    protected $appends = [
        'total_enrollments_count',
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
     * Subscriptions for this academy (through polymorphic relationship)
     */
    public function subscriptions()
    {
        return $this->morphMany(Subscription::class, 'subscriber');
    }

    /**
     * Academy subscription records (monthly billing)
     */
    public function academySubscriptions()
    {
        return $this->hasMany(AcademySubscription::class);
    }

    /**
     * Attendance logs
     */
    public function attendanceLogs()
    {
        return $this->hasMany(TeacherAttendanceLog::class);
    }

    /**
     * Get total students count across all teachers (Active only)
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
     * Get total enrollments count across all teachers (All enrollments)
     */
    public function getTotalEnrollmentsCountAttribute()
    {
        $teacherIds = $this->teachers()->pluck('teachers.id')->toArray();
        
        return \Illuminate\Support\Facades\DB::table('enrollments')
            ->whereIn('teacher_id', $teacherIds)
            ->count();
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

    /**
     * Check if academy has unlimited enrollments quota
     */
    public function hasUnlimitedQuota(): bool
    {
        return $this->max_enrollments_limit === null;
    }

    /**
     * Get current quota usage
     */
    public function getQuotaUsage(): array
    {
        $teacherIds = $this->activeTeachers()->pluck('teachers.id')->toArray();
        $currentEnrollments = \Illuminate\Support\Facades\DB::table('enrollments')
            ->whereIn('teacher_id', $teacherIds)
            ->where('is_active', true)
            ->count();

        return [
            'used' => $currentEnrollments,
            'limit' => $this->max_enrollments_limit,
            'remaining' => $this->max_enrollments_limit !== null
                ? max(0, $this->max_enrollments_limit - $currentEnrollments)
                : null,
            'unlimited' => $this->hasUnlimitedQuota(),
            'percentage' => $this->max_enrollments_limit
                ? min(100, round(($currentEnrollments / $this->max_enrollments_limit) * 100, 2))
                : 0,
        ];
    }

    /**
     * Check if academy can add more enrollments
     */
    public function canAddEnrollment(): bool
    {
        if ($this->hasUnlimitedQuota()) {
            return true;
        }

        $usage = $this->getQuotaUsage();
        return $usage['remaining'] > 0;
    }
}
