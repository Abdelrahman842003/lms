<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Lecture extends Model
{
    use HasFactory, HasUuids;

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
        'is_active',
        'is_recurring',
        'recurrence_days',
        'recurrence_time',
        'duration_minutes',
        'parent_id',
        'cancelled_dates',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'qr_code_expires_at' => 'datetime',
        'is_active' => 'boolean',
        'is_recurring' => 'boolean',
        'recurrence_days' => 'array',
        'cancelled_dates' => 'array',
    ];

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function academy()
    {
        return $this->belongsTo(Academy::class);
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function parent()
    {
        return $this->belongsTo(Lecture::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Lecture::class, 'parent_id');
    }

    public function sessions()
    {
        return $this->hasMany(LectureSession::class);
    }

    public function current_session()
    {
        return $this->hasOne(LectureSession::class)->where('date', now()->toDateString());
    }

    public function scopeFilter($query, array $filters)
    {
        if ($search = $filters['search'] ?? null) {
            $query->where('title', 'like', "%{$search}%");
        }

        if ($dateFrom = $filters['date_from'] ?? null) {
            $query->whereDate('start_time', '>=', $dateFrom);
        }

        if ($dateTo = $filters['date_to'] ?? null) {
            $query->whereDate('start_time', '<=', $dateTo);
        }

        if ($groupId = $filters['group_id'] ?? null) {
            $query->where('group_id', $groupId);
        }

        if ($status = $filters['status'] ?? null) {
            switch ($status) {
                case 'today':
                    $query->where(function ($q) {
                        $q->whereDate('start_time', \Carbon\Carbon::today())
                          ->orWhere(function ($q) {
                              $q->where('is_recurring', true)
                                ->whereJsonContains('recurrence_days', \Carbon\Carbon::now()->format('l'));
                          });
                    });
                    break;
                case 'upcoming':
                    $query->where('start_time', '>', now())
                          ->where('is_active', false);
                    break;
                case 'ongoing':
                    $query->where(function ($q) {
                        $q->where('is_active', true)
                          ->orWhere(function ($q) {
                              $q->where('start_time', '<=', now())
                                ->where('end_time', '>', now());
                          });
                    });
                    break;
                case 'finished':
                    $query->where('end_time', '<=', now())
                          ->where('is_active', false);
                    break;
                case 'recurring':
                    $query->where('is_recurring', true);
                    break;
            }
        }
    }

    public function scopeForAcademy($query, $academyId)
    {
        return $query->where('academy_id', $academyId);
    }

    public function scopeForAcademyTeachers($query, $academyId)
    {
        // Get lectures from teachers belonging to this academy
        return $query->whereHas('teacher', function ($q) use ($academyId) {
            $q->whereHas('academies', function ($aq) use ($academyId) {
                $aq->where('academy_id', $academyId)->where('is_active', true);
            });
        });
    }
}
