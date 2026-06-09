<?php

declare(strict_types=1);

namespace App\Domains\Support\Traits;

use App\Domains\Support\Scopes\TeacherProfileScope;
use App\Domains\Auth\Models\TeacherProfile;

trait UsesTeacherProfileScope
{
    /**
     * Boot the trait to apply the global scope.
     */
    public static function bootUsesTeacherProfileScope(): void
    {
        static::addGlobalScope(new TeacherProfileScope());

        // Automatically assign the current profile ID on model creation
        static::creating(function ($model) {
            if (app()->bound('currentProfile') && !$model->teacher_profile_id) {
                $model->teacher_profile_id = app('currentProfile')->id;
            }
        });
    }

    /**
     * Retrieve the model for a bound value.
     * We bypass global scopes because authorization is handled explicitly in controllers.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->withoutGlobalScopes()->where($field ?? $this->getRouteKeyName(), $value)->firstOrFail();
    }

    /**
     * Relationship to the TeacherProfile.
     */
    public function teacherProfile()
    {
        return $this->belongsTo(TeacherProfile::class, 'teacher_profile_id');
    }

    /**
     * Relationship to the base Teacher through the TeacherProfile.
     */
    public function teacher()
    {
        return $this->hasOneThrough(
            \App\Domains\Auth\Models\Teacher::class,
            \App\Domains\Auth\Models\TeacherProfile::class,
            'id',
            'id',
            'teacher_profile_id',
            'teacher_id'
        );
    }

    /**
     * Accessor for teacher_id for backward compatibility with frontend/resources.
     */
    public function getTeacherIdAttribute()
    {
        return $this->teacher_profile_id;
    }

    /**
     * Mutator for teacher_id for backward compatibility with tests/factories/force-fill.
     */
    public function setTeacherIdAttribute($value): void
    {
        if ($value) {
            $teacherId = $value instanceof \App\Domains\Auth\Models\Teacher ? $value->id : $value;
            
            // Resolve the teacher profile (prefer active independent profile if exists)
            $profile = \App\Domains\Auth\Models\TeacherProfile::where('teacher_id', $teacherId)
                ->orderByRaw("CASE WHEN type = 'independent' THEN 0 ELSE 1 END")
                ->first();
                
            if ($profile) {
                $this->attributes['teacher_profile_id'] = $profile->id;
            }
        }
    }
}

