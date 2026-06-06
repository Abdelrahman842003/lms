<?php

declare(strict_types=1);

namespace App\Domains\Auth\Models;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Gamification\Models\GamificationLevel;
use App\Domains\Gamification\Models\StudentLevelHistory;
use App\Domains\Gamification\Models\StudentPoint;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Exams\Models\ExamResult;
use App\Domains\Enrollments\Models\StudentActivityLog;
use App\Domains\Notifications\Models\SentNotification;
use App\Domains\Application\Traits\HasDeviceTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Permission\Traits\HasRoles;

use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Student extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasUuids, HasRoles, HasDeviceTokens, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'phone', 'is_active', 'gender', 'education_type', 'current_level_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected static function newFactory()
    {
        return \Database\Factories\StudentFactory::new();
    }

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'avatar_key',
        'phone',
        'parent_phone',
        'gender',
        'education_type',
        'location',
        'password',
        'teacher_id',
        'guardian_id',
        'is_active',
        'current_level_id',
    ];

    /**
     * Backward compatibility: Get parent_phone from guardian
     */
    public function getParentPhoneAttribute()
    {
        $parentPhone = $this->attributes['parent_phone'] ?? null;

        return $parentPhone ?: $this->guardian?->phone;
    }

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'gender' => \App\Domains\Auth\Enums\StudentGender::class,
            'education_type' => \App\Domains\Auth\Enums\StudentEducationType::class,
            'is_active' => 'boolean',
        ];
    }

    // Many-to-Many Relationships via Enrollment
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Guardian relationship
     */
    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    /**
     * All enrolled teacher workspaces (many-to-many through enrollments)
     */
    public function teacherProfiles()
    {
        return $this->belongsToMany(TeacherProfile::class, 'enrollments', 'student_id', 'teacher_profile_id')
            ->withPivot(['grade_id', 'group_id', 'balance', 'is_active', 'subscription_start', 'subscription_end', 'teacher_notes'])
            ->withTimestamps();
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'enrollments', 'student_id', 'group_id')
            ->withPivot(['teacher_profile_id', 'grade_id', 'balance', 'is_active', 'subscription_start', 'subscription_end', 'teacher_notes'])
            ->withTimestamps();
    }

    /**
     * Academies through enrollments
     */
    public function academies()
    {
        return $this->belongsToMany(Academy::class, 'enrollments', 'student_id', 'academy_id')
            ->withTimestamps();
    }

    /**
     * Teachers through enrollments and teacher profiles
     */
    public function teachers()
    {
        $pivotTable = '(select enrollments.*, teacher_profiles.teacher_id from enrollments join teacher_profiles on enrollments.teacher_profile_id = teacher_profiles.id where enrollments.deleted_at is null) as enrollments';
        
        $query = $this->newRelatedInstance(Teacher::class)->newQuery();
        
        return new class($query, $this, $pivotTable, 'student_id', 'teacher_id', 'id', 'id', 'teachers') extends \Illuminate\Database\Eloquent\Relations\BelongsToMany {
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

    /**
     * Grades through enrollments
     */
    public function grades()
    {
        return $this->belongsToMany(\App\Domains\Enrollments\Models\Grade::class, 'enrollments')
            ->withPivot(['teacher_profile_id', 'group_id', 'balance', 'is_active'])
            ->withTimestamps();
    }

    public function activeEnrollments()
    {
        return $this->enrollments()->where('is_active', true);
    }

    /**
     * Get enrollment for specific teacher profile
     */
    public function enrollmentFor(TeacherProfile $profile): ?Enrollment
    {
        if ($this->relationLoaded('enrollments')) {
            return $this->enrollments->firstWhere('teacher_profile_id', $profile->id);
        }

        return $this->enrollments()->where('teacher_profile_id', $profile->id)->first();
    }

    public function getGradeForProfile(TeacherProfile $profile): ?\App\Domains\Enrollments\Models\Grade
    {
        $enrollment = $this->enrollmentFor($profile);
        return $enrollment?->grade;
    }

    public function getGroupForProfile(TeacherProfile $profile): ?Group
    {
        $enrollment = $this->enrollmentFor($profile);
        return $enrollment?->group;
    }

    public function getBalanceForProfile(TeacherProfile $profile): float
    {
        $enrollment = $this->enrollmentFor($profile);
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

    public function sentNotifications()
    {
        return $this->hasMany(SentNotification::class);
    }

    /**
     * Current gamification level (global)
     */
    public function currentLevel()
    {
        return $this->belongsTo(GamificationLevel::class, 'current_level_id');
    }

    /**
     * Level-up history
     */
    public function levelHistory()
    {
        return $this->hasMany(StudentLevelHistory::class);
    }

    /**
     * Points per teacher (gamification wallet entries)
     */
    public function points(): HasMany
    {
        return $this->hasMany(StudentPoint::class);
    }

    /**
     * Get total points across all teachers
     */
    public function getTotalPointsAcrossTeachers(): int
    {
        return (int) StudentPoint::where('student_id', $this->id)->sum('total_points');
    }

    public function receivesBroadcastNotificationsOn(): string
    {
        return 'notifications.student.' . $this->id;
    }
}
