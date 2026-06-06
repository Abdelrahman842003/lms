<?php

declare(strict_types=1);

namespace App\Domains\Auth\Models;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\Question;
use App\Domains\Notifications\Models\SentNotification; // wait, is it under Notifications or Auth? We can check, but standard is namespace
use App\Domains\Notes\Models\Note; // let's check notes namespace later if needed
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TeacherProfile extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\TeacherProfileFactory::new();
    }

    protected $table = 'teacher_profiles';

    protected $fillable = [
        'teacher_id',
        'academy_id',
        'type',
        'display_name',
        'slug',
        'status',
    ];

    protected $casts = [
        'status' => 'string',
        'type' => 'string',
    ];

    /**
     * Boot function to automatically generate UUID on creation.
     */
    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->uuid = (string) Str::uuid();
        });
    }

    /**
     * Accessor for name attribute, fallback to display_name or base teacher's name.
     */
    public function getNameAttribute()
    {
        return $this->display_name ?: ($this->teacher ? $this->teacher->name : '');
    }

    /**
     * Relationship to the base Teacher (User account).
     */
    public function teacher()
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    /**
     * Relationship to the Academy (if applicable).
     */
    public function academy()
    {
        return $this->belongsTo(Academy::class, 'academy_id');
    }

    /**
     * Student enrollments for this specific workspace profile.
     */
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'teacher_profile_id');
    }

    /**
     * Get active enrollments for this profile.
     */
    public function activeEnrollments()
    {
        return $this->enrollments()->where('enrollments.is_active', true);
    }

    /**
     * Students enrolled in this specific workspace profile.
     */
    public function students()
    {
        return $this->belongsToMany(Student::class, 'enrollments', 'teacher_profile_id', 'student_id')
            ->withPivot(['grade_id', 'group_id', 'balance', 'is_active', 'subscription_start', 'subscription_end', 'teacher_notes', 'academy_id'])
            ->withTimestamps();
    }

    /**
     * Lectures belonging to this workspace profile.
     */
    public function lectures()
    {
        return $this->hasMany(Lecture::class, 'teacher_profile_id');
    }

    /**
     * Grades belonging to this workspace profile.
     */
    public function grades()
    {
        return $this->hasMany(Grade::class, 'teacher_profile_id');
    }

    /**
     * Groups belonging to this workspace profile.
     */
    public function groups()
    {
        return $this->hasMany(Group::class, 'teacher_profile_id');
    }

    /**
     * Exams belonging to this workspace profile.
     */
    public function exams()
    {
        return $this->hasMany(Exam::class, 'teacher_profile_id');
    }

    /**
     * Questions / Question Bank belonging to this workspace profile.
     */
    public function questions()
    {
        return $this->hasMany(Question::class, 'teacher_profile_id');
    }

    /**
     * Payment logs belonging to this workspace profile.
     */
    public function paymentLogs()
    {
        return $this->hasMany(\App\Domains\Subscriptions\Models\PaymentLog::class, 'teacher_profile_id');
    }

    /**
     * Notifications sent within this workspace profile.
     */
    public function sentNotifications()
    {
        return $this->hasMany(\App\Domains\Notifications\Models\SentNotification::class, 'teacher_profile_id');
    }

    /**
     * Database notifications received by the base teacher user.
     */
    public function notifications()
    {
        return $this->teacher->notifications();
    }

    /**
     * Secretaries managing this specific profile.
     */
    public function secretaries()
    {
        return $this->belongsToMany(Secretary::class, 'secretary_teacher', 'teacher_profile_id', 'secretary_id')
            ->withTimestamps();
    }

    /**
     * Delegate plan and tenant attributes to the base teacher model.
     */
    public function __get($key)
    {
        $value = parent::__get($key);
        if ($value !== null) {
            return $value;
        }

        // Delegate specific fields to the base teacher model to preserve compatibility
        $delegated = [
            'plan_expires_at', 
            'is_unlimited_students', 
            'plan_max_students', 
            'trial_period_days', 
            'plan_type',
            'is_independent_active',
            'has_videos_addon',
        ];

        if (in_array($key, $delegated, true)) {
            return $this->teacher ? $this->teacher->$key : null;
        }

        return null;
    }
}
