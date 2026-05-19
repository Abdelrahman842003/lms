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
        'exam_fail_deduction',
        'exam_passing_percentage',
        'question_easy_points',
        'question_medium_points',
        'question_hard_points',
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

    protected function casts(): array
    {
        return [
            'attendance_points' => 'integer',
            'perfect_month_bonus' => 'integer',
            'exam_max_points' => 'integer',
            'exam_retake_bonus' => 'integer',
            'exam_first_place_bonus' => 'integer',
            'exam_fail_deduction' => 'integer',
            'exam_passing_percentage' => 'integer',
            'question_easy_points' => 'integer',
            'question_medium_points' => 'integer',
            'question_hard_points' => 'integer',
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
    }

    // Default values
    const DEFAULTS = [
        'attendance_points' => 10,
        'perfect_month_bonus' => 30,
        'exam_max_points' => 50,
        'exam_retake_bonus' => 20,
        'exam_first_place_bonus' => 25,
        'exam_fail_deduction' => 10,
        'exam_passing_percentage' => 50,
        'question_easy_points' => 1,
        'question_medium_points' => 2,
        'question_hard_points' => 3,
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
     * Get or create settings for a teacher with defaults from global settings
     */
    public static function getOrCreate(string $teacherId): self
    {
        $settings = self::where('teacher_id', $teacherId)->first();
        
        if (!$settings) {
            $settings = new self(['teacher_id' => $teacherId]);
        }

        // ملء القيم من الإعدادات العامة
        foreach (self::DEFAULTS as $key => $defaultValue) {
            $globalValue = \App\Domains\Application\Models\Setting::getValue('gamification_' . $key);
            if ($globalValue !== null) {
                $settings->{$key} = is_numeric($globalValue) ? (int) $globalValue : $globalValue;
            } else {
                $settings->{$key} = $defaultValue;
            }
        }

        return $settings;
    }

    /**
     * Get global setting value with fallback to defaults
     */
    public static function getGlobalValue(string $key)
    {
        $globalValue = \App\Domains\Application\Models\Setting::getValue('gamification_' . $key);
        return $globalValue !== null ? $globalValue : (self::DEFAULTS[$key] ?? null);
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
