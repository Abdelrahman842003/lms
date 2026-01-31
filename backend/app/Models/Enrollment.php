<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Enrollment extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'student_id',
        'teacher_id',
        'grade_id',
        'group_id',
        'academy_id',
        'balance',
        'is_active',
        'subscription_start',
        'subscription_end',
        'teacher_notes',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'is_active' => 'boolean',
            'subscription_start' => 'date',
            'subscription_end' => 'date',
        ];
    }

    protected $appends = ['status', 'days_left', 'trial_ends_at'];

    // Accessors
    public function getStatusAttribute()
    {
        $today = now()->startOfDay();
        $trialPeriodDays = (int) \App\Models\Setting::getValue('trial_period_days', 4);
        
        // Check trial period for new enrollments (not yet activated)
        if (!$this->is_active && !$this->subscription_end) {
            $trialEndDate = $this->created_at->copy()->addDays($trialPeriodDays)->startOfDay();
            
            if ($today <= $trialEndDate) {
                return 'trial';
            }
            
            return 'inactive'; // Trial expired, not activated
        }
        
        // Manually deactivated by teacher
        if (!$this->is_active) {
            return 'inactive';
        }

        // Active but no subscription yet - check trial period
        if (!$this->subscription_end) {
            $trialEndDate = $this->created_at->copy()->addDays($trialPeriodDays)->startOfDay();
            
            if ($today <= $trialEndDate) {
                return 'trial';
            }
            
            return 'inactive'; // Trial expired, no subscription
        }

        $end = $this->subscription_end->startOfDay();
        
        // Active: Subscription not expired yet
        if ($end >= $today) {
            return 'active';
        }

        // Subscription expired - check post-subscription trial period
        $postSubscriptionTrialEnd = $end->copy()->addDays($trialPeriodDays);
        if ($today <= $postSubscriptionTrialEnd) {
            return 'trial';
        }

        // Grace Period: Trial expired but within 3 days
        $gracePeriodEnd = $postSubscriptionTrialEnd->copy()->addDays(3);
        if ($today <= $gracePeriodEnd) {
            return 'grace_period';
        }

        // Expired: Past all grace periods
        return 'expired';
    }

    public function getDaysLeftAttribute()
    {
        if (!$this->subscription_end) {
            return 0;
        }

        $today = now()->startOfDay();
        $end = $this->subscription_end->startOfDay();

        return (int) $today->diffInDays($end, false);
    }

    public function getTrialEndsAtAttribute()
    {
        $trialPeriodDays = (int) \App\Models\Setting::getValue('trial_period_days', 4);
        
        // Trial from creation (new enrollment, not activated OR active but no subscription)
        if (!$this->subscription_end) {
            return $this->created_at->copy()->addDays($trialPeriodDays);
        }
        
        // Trial after subscription ends
        if ($this->subscription_end && now() > $this->subscription_end) {
            return $this->subscription_end->copy()->addDays($trialPeriodDays);
        }
        
        return null;
    }

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function academy()
    {
        return $this->belongsTo(Academy::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(StudentActivityLog::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    public function scopeFilter($query, array $filters)
    {
        if ($search = $filters['search'] ?? null) {
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (($status = $filters['status'] ?? null) !== null && $status !== '') {
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        if ($gradeId = $filters['grade_id'] ?? null) {
            $query->where('grade_id', $gradeId);
        }

        if ($groupId = $filters['group_id'] ?? null) {
            $query->where('group_id', $groupId);
        }
    }
}
