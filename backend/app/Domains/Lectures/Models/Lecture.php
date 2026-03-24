<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Models;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Application\Traits\GuardsSensitiveFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Lecture extends Model
{
    use GuardsSensitiveFields;
    use HasFactory, HasUuids;

    protected static function newFactory()
    {
        return \Database\Factories\LectureFactory::new();
    }

    protected $fillable = [
        'teacher_id',
        'academy_id',
        'grade_id',
        'group_id',
        'title',
        'description',
        'start_time',
        'end_time',
        'qr_code',
        'qr_code_expires_at',
        'is_recurring',
        'recurrence_days',
        'recurrence_time',
        'duration_minutes',
        'parent_id',
        'cancelled_dates',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'qr_code_expires_at' => 'datetime',
            'is_active' => 'boolean',
            'is_recurring' => 'boolean',
            'recurrence_days' => 'array',
            'cancelled_dates' => 'array',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function academy(): BelongsTo
    {
        return $this->belongsTo(Academy::class);
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Lecture::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Lecture::class, 'parent_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(LectureSession::class);
    }

    public function currentSession(): HasOne
    {
        return $this->hasOne(LectureSession::class)->where('date', now()->toDateString());
    }

    public function scopeForAcademy($query, $academyId)
    {
        return $query->where('academy_id', $academyId);
    }

    public function scopeForAcademyTeachers($query, $academyId)
    {
        // Get lectures from teachers belonging to this academy using direct join
        return $query->join('teachers', 'lectures.teacher_id', '=', 'teachers.id')
            ->join('academy_teacher', function ($join) use ($academyId) {
                $join->on('teachers.id', '=', 'academy_teacher.teacher_id')
                    ->where('academy_teacher.academy_id', $academyId)
                    ->where('academy_teacher.is_active', true);
            })
            ->select('lectures.*');
    }
}
