<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Services;

use App\Domains\Auth\Models\Student;
use App\Domains\Gamification\Models\GamificationLevel;
use App\Domains\Gamification\Models\StudentLevelHistory;
use App\Domains\Gamification\Models\StudentPoint;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class LevelService
{
    /**
     * Check if the student should level up based on total points across all teachers.
     * Called after every addPoints() in StudentPoint.
     */
    public function checkAndLevelUp(Student $student): ?StudentLevelHistory
    {
        $totalPoints = $student->getTotalPointsAcrossTeachers();
        $newLevel = GamificationLevel::findForPoints($totalPoints);

        if (!$newLevel) {
            return null;
        }

        // If student has no level yet, or if the new level is higher
        $currentLevelId = $student->current_level_id;

        if ($currentLevelId === $newLevel->id) {
            return null; // Same level, no change
        }

        // Check if this is actually a higher level (not a downgrade)
        if ($currentLevelId) {
            $currentLevel = GamificationLevel::find($currentLevelId);
            if ($currentLevel && $currentLevel->sort_order >= $newLevel->sort_order) {
                return null; // Not a level up
            }
        }

        // Level up! Update student
        $student->update(['current_level_id' => $newLevel->id]);

        // Check if we already have a history record for this level
        $existingHistory = StudentLevelHistory::where('student_id', $student->id)
            ->where('level_id', $newLevel->id)
            ->first();

        if ($existingHistory) {
            return $existingHistory;
        }

        // Create level history record
        $history = StudentLevelHistory::create([
            'student_id' => $student->id,
            'level_id' => $newLevel->id,
            'points_at_levelup' => $totalPoints,
            'achieved_at' => now(),
        ]);

        // Generate certificate asynchronously (or sync for now)
        try {
            $certificatePath = $this->generateCertificate($history);
            $history->update(['certificate_path' => $certificatePath]);
        } catch (\Throwable $e) {
            Log::error('Failed to generate level-up certificate', [
                'student_id' => $student->id,
                'level_id' => $newLevel->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $history;
    }

    /**
     * Get student's complete achievement info for the achievements page.
     */
    public function getStudentAchievements(Student $student): array
    {
        $totalPoints = $student->getTotalPointsAcrossTeachers();
        $allLevels = GamificationLevel::allOrdered();
        $currentLevel = $student->currentLevel;

        // If student has no level assigned yet, try to determine it
        if (!$currentLevel) {
            $currentLevel = GamificationLevel::findForPoints($totalPoints);
            if ($currentLevel) {
                $student->update(['current_level_id' => $currentLevel->id]);
            }
        }

        $nextLevel = $currentLevel?->getNextLevel();

        // Calculate progress percentage to next level
        $progressPercentage = 0.0;
        $pointsToNextLevel = 0;

        if ($currentLevel && $nextLevel) {
            $levelRange = $nextLevel->min_points - $currentLevel->min_points;
            $pointsInLevel = $totalPoints - $currentLevel->min_points;
            $progressPercentage = $levelRange > 0
                ? round(($pointsInLevel / $levelRange) * 100, 1)
                : 100.0;
            $progressPercentage = min($progressPercentage, 100.0);
            $pointsToNextLevel = max(0, $nextLevel->min_points - $totalPoints);
        } elseif ($currentLevel && !$nextLevel) {
            // Last level reached
            $progressPercentage = 100.0;
            $pointsToNextLevel = 0;
        }

        // Points breakdown per teacher
        $pointsBreakdown = StudentPoint::where('student_id', $student->id)
            ->with('teacher:id,name,avatar_key')
            ->get()
            ->map(fn ($sp) => [
                'teacher' => $sp->teacher,
                'points' => $sp->total_points,
            ]);

        // Level history with certificate info
        $history = $student->levelHistory()
            ->with('level')
            ->orderByDesc('achieved_at')
            ->get()
            ->map(fn ($h) => [
                'id' => $h->id,
                'level_name' => $h->level->name,
                'level_icon' => $h->level->icon,
                'level_color' => $h->level->color,
                'achieved_at' => $h->achieved_at->toISOString(),
                'has_certificate' => $h->hasCertificate(),
            ]);

        // All levels with achieved status
        $achievedLevelIds = $student->levelHistory()->pluck('level_id')->toArray();
        $levelsTimeline = $allLevels->map(fn ($level) => [
            'id' => $level->id,
            'name' => $level->name,
            'description' => $level->description,
            'icon' => $level->icon,
            'color' => $level->color,
            'min_points' => $level->min_points,
            'max_points' => $level->max_points,
            'sort_order' => $level->sort_order,
            'is_current' => $currentLevel && $currentLevel->id === $level->id,
            'is_achieved' => in_array($level->id, $achievedLevelIds),
        ]);

        return [
            'total_points' => $totalPoints,
            'current_level' => $currentLevel ? [
                'id' => $currentLevel->id,
                'name' => $currentLevel->name,
                'description' => $currentLevel->description,
                'icon' => $currentLevel->icon,
                'color' => $currentLevel->color,
                'sort_order' => $currentLevel->sort_order,
                'min_points' => $currentLevel->min_points,
                'max_points' => $currentLevel->max_points,
            ] : null,
            'next_level' => $nextLevel ? [
                'name' => $nextLevel->name,
                'icon' => $nextLevel->icon,
                'min_points' => $nextLevel->min_points,
            ] : null,
            'progress_percentage' => $progressPercentage,
            'points_to_next_level' => $pointsToNextLevel,
            'points_breakdown' => $pointsBreakdown,
            'levels_timeline' => $levelsTimeline,
            'history' => $history,
        ];
    }

    /**
     * Generate a PDF certificate for a level-up achievement.
     */
    public function generateCertificate(StudentLevelHistory $history): string
    {
        $history->loadMissing(['student', 'level']);

        $data = [
            'student_name' => $history->student->name,
            'level_name' => $history->level->name,
            'level_icon' => $history->level->icon,
            'level_color' => $history->level->color,
            'achieved_at' => $history->achieved_at->format('Y/m/d'),
            'platform_name' => config('app.name', 'المنصة التعليمية'),
        ];

        $pdf = Pdf::loadView('certificates.level-up', $data)
            ->setPaper('a4', 'landscape');

        $filename = "certificates/{$history->student_id}/{$history->id}.pdf";
        Storage::disk('local')->put($filename, $pdf->output());

        return $filename;
    }

    /**
     * Get certificate file path for download.
     */
    public function getCertificatePath(StudentLevelHistory $history): ?string
    {
        if (!$history->certificate_path) {
            return null;
        }

        return Storage::disk('local')->path($history->certificate_path);
    }
}
