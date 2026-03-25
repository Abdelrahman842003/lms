<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Strategies;

use App\Domains\Auth\Models\Student;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\PointTransaction;

/**
 * Strategy interface for point calculation algorithms.
 *
 * Implementations define how points are calculated for different activities
 * (attendance, exams, videos, quests, etc.).
 *
 * WHY THIS INTERFACE IS SEPARATE FROM XpCalculationStrategy:
 * ============================================================================
 *
 * 1. DIFFERENT PURPOSES:
 * - Points: Transactional rewards that can be redeemed, transferred, or expire
 * - XP (Experience Points): Used for leveling up students, tracking overall progress
 *
 * 2. DIFFERENT SIGNATURES:
 * - This interface: calculate(Student, context, settings) with additional metadata methods
 * - XpCalculationStrategy: calculate(settings, array context) - simpler signature
 *
 * 3. DIFFERENT COMPLEXITY:
 * - Points: Requires transaction tracking, metadata (type, reference), and descriptions
 * - XP: Simple calculation based on activity type and settings
 *
 * 4. DIFFERENT STORAGE:
 * - Points: Stored as individual PointTransaction records with full audit trail
 * - XP: Aggregated into student's total XP for level calculation
 *
 * 5. ADDITIONAL METHODS:
 * This interface includes methods for transaction metadata that XP doesn't need:
 * - supports(): Check if strategy handles the given context
 * - getTransactionType(): Type for categorizing transactions
 * - getReferenceType()/getReferenceId(): Link to related entities
 * - generateDescription(): Human-readable transaction description
 *
 * @see XpCalculationStrategy For simple XP calculations
 * @see https://refactoring.guru/design-patterns/strategy Strategy Pattern
 */
interface PointCalculationStrategyInterface
{
    /**
     * Calculate points for the given context.
     *
     * @param Student $student The student receiving points
     * @param mixed $context Activity-specific context (Lecture, ExamResult, Video, etc.)
     * @param GamificationSetting $settings The gamification settings
     * @return int The number of points to award
     */
    public function calculate(Student $student, mixed $context, GamificationSetting $settings): int;

    /**
     * Check if this strategy can handle the given context.
     *
     * @param mixed $context
     * @return bool
     */
    public function supports(mixed $context): bool;

    /**
     * Get the transaction type for this strategy.
     *
     * @return string
     */
    public function getTransactionType(): string;

    /**
     * Get the reference type for the transaction.
     *
     * @param mixed $context
     * @return string|null
     */
    public function getReferenceType(mixed $context): ?string;

    /**
     * Get the reference ID for the transaction.
     *
     * @param mixed $context
     * @return string|null
     */
    public function getReferenceId(mixed $context): ?string;

    /**
     * Generate a description for the transaction.
     *
     * @param mixed $context
     * @param int $points
     * @return string
     */
    public function generateDescription(mixed $context, int $points): string;
}
