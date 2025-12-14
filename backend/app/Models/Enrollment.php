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

    protected $appends = ['status', 'days_left'];

    // Accessors
    public function getStatusAttribute()
    {
        if (!$this->is_active) {
            return 'inactive';
        }

        if (!$this->subscription_end) {
            return 'inactive'; // Not yet activated
        }

        $today = now()->startOfDay();
        $end = $this->subscription_end->startOfDay();
        
        // Active: Not expired yet
        if ($end >= $today) {
            return 'active';
        }

        // Grace Period: Expired but within 3 days
        $gracePeriodEnd = $end->copy()->addDays(3);
        if ($today <= $gracePeriodEnd) {
            return 'grace_period';
        }

        // Expired: Past grace period
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
