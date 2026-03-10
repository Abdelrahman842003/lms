<?php

declare(strict_types=1);

namespace App\Domains\Support\Models;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherAttendanceLog extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'academy_id',
        'teacher_id',
        'date',
        'checked_in_at',
        'checked_out_at',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'checked_in_at' => 'datetime',
            'checked_out_at' => 'datetime',
            'status' => \App\Domains\Auth\Enums\TeacherAttendanceStatus::class,
        ];
    }

    /**
     * Academy relationship
     */
    public function academy(): BelongsTo
    {
        return $this->belongsTo(Academy::class);
    }

    /**
     * Teacher relationship
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    /**
     * Get duration in minutes
     */
    public function getDurationMinutesAttribute()
    {
        if (!$this->checked_in_at || !$this->checked_out_at) {
            return 0;
        }

        return $this->checked_in_at->diffInMinutes($this->checked_out_at);
    }

    /**
     * Get duration formatted
     */
    public function getDurationFormattedAttribute()
    {
        $minutes = $this->duration_minutes;
        $hours = floor($minutes / 60);
        $mins = $minutes % 60;

        return sprintf('%dh %dm', $hours, $mins);
    }

    /**
     * Scope for specific academy
     */
    public function scopeForAcademy($query, $academyId)
    {
        return $query->where('academy_id', $academyId);
    }

    /**
     * Scope for specific teacher
     */
    public function scopeForTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    /**
     * Scope for date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    /**
     * Scope for checked in
     */
    public function scopeCheckedIn($query)
    {
        return $query->where('status', 'checked_in');
    }

    /**
     * Scope for checked out
     */
    public function scopeCheckedOut($query)
    {
        return $query->where('status', 'checked_out');
    }

    /**
     * Scope for filtering
     */
    public function scopeFilter($query, array $filters)
    {
        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }

        if ($dateFrom = $filters['date_from'] ?? null) {
            $query->whereDate('date', '>=', $dateFrom);
        }

        if ($dateTo = $filters['date_to'] ?? null) {
            $query->whereDate('date', '<=', $dateTo);
        }
    }
}
