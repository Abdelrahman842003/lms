<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Models;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Services\EnrollmentStatusService;
use Closure;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Enrollment extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * Static resolver for the status service.
     * Can be overridden in tests to inject mock services.
     *
     * @var \Closure|null
     */
    protected static ?Closure $statusServiceResolver = null;

    /**
     * Set a custom resolver for the status service.
     * Useful for testing - allows injecting mock services.
     *
     * @param \Closure|null $resolver A function that returns an EnrollmentStatusService instance
     */
    public static function setStatusServiceResolver(?Closure $resolver): void
    {
        static::$statusServiceResolver = $resolver;
    }

    /**
     * Clear the custom status service resolver.
     * Call this in test tearDown to ensure clean state.
     */
    public static function clearStatusServiceResolver(): void
    {
        static::$statusServiceResolver = null;
    }

    protected $fillable = [
        'student_id',
        'teacher_id',
        'grade_id',
        'group_id',
        'academy_id',
        'subscription_start',
        'subscription_end',
        'teacher_notes',
        'status',
        'is_active',
        'balance',
        'joined_at',
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
     *
     * Uses a resolver pattern to allow dependency injection in tests.
     * In production, this falls back to the service container.
     *
     * Note: We use app() here because Laravel models don't support
     * constructor injection well. The resolver pattern allows us to
     * swap this for testing while keeping the production code clean.
     */
    protected function getStatusService(): EnrollmentStatusService
    {
        if (static::$statusServiceResolver !== null) {
            return (static::$statusServiceResolver)();
        }

        return app(EnrollmentStatusService::class);
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
