<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Strategies;

use App\Domains\Gamification\Models\GamificationSetting;

/**
 * Strategy Interface لحساب XP (Experience Points).
 * كل نوع نشاط (حضور / امتحان / مراجعة) له Calculator خاص.
 *
 * WHY THIS INTERFACE IS SEPARATE FROM PointCalculationStrategyInterface:
 * ============================================================================
 *
 * 1. DIFFERENT PURPOSES:
 * - XP (Experience Points): Used for leveling up students, tracking overall progress
 * - Points: Transactional rewards that can be redeemed, transferred, or expire
 *
 * 2. DIFFERENT SIGNATURES:
 * - XpCalculationStrategy::calculate(): Takes settings + array context, returns int
 * - PointCalculationStrategyInterface::calculate(): Takes Student + context + settings, returns int
 *
 * 3. DIFFERENT COMPLEXITY:
 * - XP: Simple calculation based on activity type and settings
 * - Points: Requires transaction tracking, metadata (type, reference), and descriptions
 *
 * 4. DIFFERENT STORAGE:
 * - XP: Aggregated into student's total XP for level calculation
 * - Points: Stored as individual PointTransaction records with full audit trail
 *
 * @see PointCalculationStrategyInterface For transactional point calculations
 * @see https://refactoring.guru/design-patterns/strategy Strategy Pattern
 */
interface XpCalculationStrategy
{
    /**
     * يحسب نقاط XP بناءً على السياق الممرر.
     *
     * @param GamificationSetting $settings إعدادات نظام اللعاب
     * @param array<string, mixed> $context سياق النشاط (نوع النشاط، القيم، إلخ)
     * @return int نقاط XP المستحقة
     */
    public function calculate(GamificationSetting $settings, array $context): int;
}
