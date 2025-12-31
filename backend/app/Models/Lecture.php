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
        'grade_id',
        'group_id',
        'title',
        'description',
        'start_time',
        'end_time',
        'qr_code',
        'qr_code_expires_at',
        'is_active',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'qr_code_expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

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

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
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
    }
}
