<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Models;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Services\EnrollmentStatusService;
use App\Domains\Application\Traits\GuardsSensitiveFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Enrollment extends Model
{
    use GuardsSensitiveFields;
    use HasFactory, HasUuids, SoftDeletes;

    protected static ?EnrollmentStatusService $statusService = null;

    protected $fillable = [
        'student_id',
        'teacher_id',
        'grade_id',
        'group_id',
        'academy_id',
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

    protected $appends = [];

    // Accessors
    public function getStatusAttribute()
    {
        return $this->getStatusService()->getStatus($this);
    }

    public function getDaysLeftAttribute()
    {
        return $this->getStatusService()->getDaysLeft($this);
    }

    public function getTrialEndsAtAttribute()
    {
        return $this->getStatusService()->getTrialEndsAt($this);
    }

    /**
     * Get the status service instance.
     */
    protected function getStatusService(): EnrollmentStatusService
    {
        if (self::$statusService === null) {
            self::$statusService = new EnrollmentStatusService;
        }

        return self::$statusService;
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

    // Note: Filtering logic moved to \App\Domains\Application\Filters\EnrollmentFilter
}
