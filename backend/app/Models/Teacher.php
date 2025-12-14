<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\HasDeviceTokens;

class Teacher extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasUuids, HasDeviceTokens;

    protected $connection = 'mysql'; // Central DB

    protected $fillable = [
        'name',
        'username',
        'phone',
        'password',
        'avatar_key',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    // Many-to-Many Relationships via Enrollment
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'enrollments')
            ->withPivot(['grade_id', 'group_id', 'balance', 'is_active', 'subscription_start', 'subscription_end', 'teacher_notes'])
            ->withTimestamps();
    }

    public function activeEnrollments()
    {
        return $this->enrollments()->where('is_active', true);
    }

    public function activeStudents()
    {
        return $this->students()->wherePivot('is_active', true);
    }

    // Get enrollment for specific student
    public function enrollmentFor(Student $student): ?Enrollment
    {
        return $this->enrollments()->where('student_id', $student->id)->first();
    }

    public function secretaries()
    {
        return $this->hasMany(Secretary::class);
    }

    public function lectures()
    {
        return $this->hasMany(Lecture::class);
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    public function groups()
    {
        return $this->hasMany(Group::class);
    }
    public function scopeFilter($query, array $filters)
    {
        if ($search = $filters['search'] ?? null) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%");
            });
        }

        if ($dateFrom = $filters['date_from'] ?? null) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $filters['date_to'] ?? null) {
            $query->whereDate('created_at', '<=', $dateTo);
        }
    }
}
