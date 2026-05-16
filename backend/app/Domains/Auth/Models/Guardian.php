<?php

declare(strict_types=1);

namespace App\Domains\Auth\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Guardian extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'phone'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'phone',
        'name',
        'avatar_key',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'password' => 'hashed',
        ];
    }

    /**
     * Get all students for this guardian
     */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    /**
     * Legacy support: Get students by parent_phone
     */
    public function studentsByPhone()
    {
        return Student::where('parent_phone', $this->phone)->get();
    }
    /**
     * Get the device tokens for the guardian.
     */
    public function deviceTokens(): MorphMany
    {
        return $this->morphMany(DeviceToken::class, 'tokenable');
    }

    /**
     * Route notifications for the FCM channel.
     *
     * @return array
     */
    public function routeNotificationForFcm()
    {
        return $this->deviceTokens()->pluck('token')->toArray();
    }

    /**
     * Check if all students associated with this guardian are inactive or suspended
     */
    public function hasOnlyInactiveStudents(): bool
    {
        $students = $this->students;
        
        if ($students->isEmpty()) {
            return true;
        }

        foreach ($students as $student) {
            // If at least one student is active and has an active enrollment, guardian is NOT blocked
            $hasActiveEnrollment = \App\Domains\Enrollments\Models\Enrollment::where('student_id', $student->id)
                ->where('status', 'active')
                ->exists();
            
            if ($student->status === 'active' && $hasActiveEnrollment) {
                return false;
            }
        }

        return true;
    }
}
