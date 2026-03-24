<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Models;

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Support\Traits\GuardsSensitiveFields;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentPoint extends Model
{
    use GuardsSensitiveFields;
    use HasUuids;

    protected $fillable = [
        'student_id',
        'teacher_id',
        'attendance_streak',
    ];

    protected function casts(): array
    {
        return [
            'total_points' => 'integer',
            'attendance_streak' => 'integer',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class, 'student_id', 'student_id')
            ->where('teacher_id', $this->getAttribute('teacher_id'));
    }

    /**
     * Get or create student points record for a student-teacher pair
     */
    public static function getOrCreate(string $studentId, string $teacherId): self
    {
        return self::firstOrCreate(
            ['student_id' => $studentId, 'teacher_id' => $teacherId],
            ['total_points' => 0, 'attendance_streak' => 0]
        );
    }

    /**
     * Add points and record transaction
     */
    public function addPoints(int $points, string $type, ?string $referenceType = null, ?string $referenceId = null, ?string $description = null): PointTransaction
    {
        $this->increment('total_points', $points);

        return PointTransaction::create([
            'student_id' => $this->student_id,
            'teacher_id' => $this->teacher_id,
            'type' => $type,
            'points' => $points,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'description' => $description,
        ]);
    }

    /**
     * Increment attendance streak
     */
    public function incrementStreak(): int
    {
        $this->increment('attendance_streak');
        return $this->attendance_streak;
    }

    /**
     * Reset attendance streak
     */
    public function resetStreak(): void
    {
        $this->update(['attendance_streak' => 0]);
    }

    /**
     * Scope for leaderboard query
     */
    public function scopeLeaderboard($query, string $teacherId, int $limit = 5)
    {
        return $query->where('teacher_id', $teacherId)
            ->orderByDesc('total_points')
            ->with('student:id,name,avatar_key')
            ->limit($limit);
    }

    /**
     * Get weekly leaderboard (points earned this week)
     */
    public static function weeklyLeaderboard(string $teacherId, int $limit = 5)
    {
        return PointTransaction::where('teacher_id', $teacherId)
            ->where('created_at', '>=', now()->startOfWeek())
            ->selectRaw('student_id, SUM(points) as weekly_points')
            ->groupBy('student_id')
            ->orderByDesc('weekly_points')
            ->with('student:id,name,avatar_key')
            ->limit($limit)
            ->get();
    }
}
