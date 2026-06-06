<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Models;

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\TeacherProfile;
use App\Domains\Support\Traits\UsesTeacherProfileScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentPoint extends Model
{
    use HasUuids, UsesTeacherProfileScope;

    protected $fillable = [
        'student_id',
        'teacher_profile_id',
        'attendance_streak',
        'total_points',
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

    // The teacherProfile relation is provided by the UsesTeacherProfileScope trait.

    public function teacher()
    {
        return $this->hasOneThrough(
            \App\Domains\Auth\Models\Teacher::class,
            TeacherProfile::class,
            'id', // Local key on teacher_profiles...
            'id', // Local key on teachers...
            'teacher_profile_id', // Foreign key on student_points...
            'teacher_id' // Foreign key on teacher_profiles...
        );
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class, 'student_id', 'student_id')
            ->where('teacher_profile_id', $this->getAttribute('teacher_profile_id'));
    }

    /**
     * Get or create student points record for a student-profile pair
     */
    public static function getOrCreate(string $studentId, string|int $teacherProfileId): self
    {
        return self::firstOrCreate(
            ['student_id' => $studentId, 'teacher_profile_id' => $teacherProfileId],
            ['total_points' => 0, 'attendance_streak' => 0]
        );
    }

    /**
     * Add points and record transaction
     */
    public function addPoints(int $points, string $type, ?string $referenceType = null, ?string $referenceId = null, ?string $description = null): PointTransaction
    {
        $this->increment('total_points', $points);

        $transaction = PointTransaction::create([
            'student_id' => $this->student_id,
            'teacher_profile_id' => $this->teacher_profile_id,
            'type' => $type,
            'points' => $points,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'description' => $description,
        ]);

        // Check for level-up after points change (global across all teachers)
        try {
            $student = $this->student ?? \App\Domains\Auth\Models\Student::find($this->student_id);
            if ($student) {
                app(\App\Domains\Gamification\Services\LevelService::class)->checkAndLevelUp($student);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Level-up check failed', [
                'student_id' => $this->student_id,
                'error' => $e->getMessage(),
            ]);
        }

        return $transaction;
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
    public function scopeLeaderboard($query, int $teacherProfileId, int $limit = 5)
    {
        return $query->where('teacher_profile_id', $teacherProfileId)
            ->orderByDesc('total_points')
            ->with('student:id,name,avatar_key')
            ->limit($limit);
    }

    /**
     * Get weekly leaderboard (points earned this week)
     */
    public static function weeklyLeaderboard(int $teacherProfileId, int $limit = 5)
    {
        return PointTransaction::where('teacher_profile_id', $teacherProfileId)
            ->where('created_at', '>=', now()->startOfWeek())
            ->selectRaw('student_id, SUM(points) as weekly_points')
            ->groupBy('student_id')
            ->orderByDesc('weekly_points')
            ->with('student:id,name,avatar_key')
            ->limit($limit)
            ->get();
    }
}
