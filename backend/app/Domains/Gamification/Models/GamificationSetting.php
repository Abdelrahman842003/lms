<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Models;

use App\Domains\Auth\Models\Teacher;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GamificationSetting extends Model
{
    use HasUuids;

    protected $fillable = [
        'teacher_id',
        'attendance_points',
        'perfect_month_bonus',
        'exam_max_points',
        'exam_retake_bonus',
        'exam_first_place_bonus',
        'streak_5_bonus',
        'streak_10_bonus',
        'is_enabled',
        'show_leaderboard',
        'leaderboard_size',
        // نقاط الفيديوهات
        'video_watch_points',
        'video_quiz_max_points',
        'video_quiz_perfect_bonus',
        'video_first_watch_bonus',
    ];

    protected $casts = [
        'attendance_points' => 'integer',
        'perfect_month_bonus' => 'integer',
        'exam_max_points' => 'integer',
        'exam_retake_bonus' => 'integer',
        'exam_first_place_bonus' => 'integer',
        'streak_5_bonus' => 'integer',
        'streak_10_bonus' => 'integer',
        'is_enabled' => 'boolean',
        'show_leaderboard' => 'boolean',
        'leaderboard_size' => 'integer',
        // نقاط الفيديوهات
        'video_watch_points'      => 'integer',
        'video_quiz_max_points'   => 'integer',
        'video_quiz_perfect_bonus'=> 'integer',
        'video_first_watch_bonus' => 'integer',
    ];

    // Default values
    const DEFAULTS = [
        'attendance_points' => 10,
        'perfect_month_bonus' => 30,
        'exam_max_points' => 50,
        'exam_retake_bonus' => 20,
        'exam_first_place_bonus' => 25,
        'streak_5_bonus' => 15,
        'streak_10_bonus' => 30,
        'is_enabled' => true,
        'show_leaderboard' => true,
        'leaderboard_size' => 5,
        // نقاط الفيديوهات
        'video_watch_points'       => 5,
        'video_quiz_max_points'    => 20,
        'video_quiz_perfect_bonus' => 5,
        'video_first_watch_bonus'  => 5,
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    /**
     * Get or create settings for a teacher with defaults
     */
    public static function getOrCreate(string $teacherId): self
    {
        return self::firstOrCreate(
            ['teacher_id' => $teacherId],
            self::DEFAULTS
        );
    }

    /**
     * Calculate exam points based on percentage
     */
    public function calculateExamPoints(float $percentage): int
    {
        return (int) round(($percentage / 100) * $this->exam_max_points);
    }

    /**
     * Calculate video quiz points based on percentage
     */
    public function calculateVideoQuizPoints(float $percentage): int
    {
        return (int) round(($percentage / 100) * $this->video_quiz_max_points);
    }
}
