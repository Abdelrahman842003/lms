<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Services;

use App\Domains\Auth\Models\Student;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\PointTransaction;
use App\Domains\Gamification\Models\StudentPoint;
use App\Domains\Gamification\Strategies\PointCalculationStrategyInterface;
use App\Domains\Application\Services\CacheService;
use InvalidArgumentException;

/**
 * Context class for the Strategy Pattern in point calculations.
 * 
 * This class manages point calculation strategies and delegates
 * the actual calculation to the appropriate strategy.
 * 
 * @see https://refactoring.guru/design-patterns/strategy
 */
class PointCalculator
{
    /**
     * @var array<string, PointCalculationStrategyInterface>
     */
    private array $strategies = [];

    /**
     * Register a point calculation strategy.
     */
    public function registerStrategy(PointCalculationStrategyInterface $strategy): self
    {
        $this->strategies[$strategy->getTransactionType()] = $strategy;
        return $this;
    }

    /**
     * Get a strategy by transaction type.
     */
    public function getStrategy(string $type): ?PointCalculationStrategyInterface
    {
        return $this->strategies[$type] ?? null;
    }

    /**
     * Find a strategy that supports the given context.
     */
    public function findStrategyFor(mixed $context): ?PointCalculationStrategyInterface
    {
        foreach ($this->strategies as $strategy) {
            if ($strategy->supports($context)) {
                return $strategy;
            }
        }

        return null;
    }

    /**
     * Calculate and award points using the appropriate strategy.
     *
     * @param Student $student The student receiving points
     * @param mixed $context Activity context (Lecture, ExamResult, Video, etc.)
     * @param string|null $teacherId Teacher ID (extracted from context if not provided)
     * @return PointTransaction|null
     */
    public function awardPoints(Student $student, mixed $context, ?string $teacherId = null): ?PointTransaction
    {
        $strategy = $this->findStrategyFor($context);

        if ($strategy === null) {
            return null;
        }

        // Get teacher ID from context if not provided
        $teacherId = $teacherId ?? $this->extractTeacherId($context);

        if ($teacherId === null) {
            return null;
        }

        // Get settings
        $settings = CacheService::getGamificationSettings(
            $teacherId,
            fn() => GamificationSetting::getOrCreate($teacherId)
        );

        if (!$settings->is_enabled) {
            return null;
        }

        // Check for duplicate
        if ($this->isDuplicate($student, $teacherId, $strategy, $context)) {
            return null;
        }

        // Calculate points
        $points = $strategy->calculate($student, $context, $settings);

        // Validate points - reject negative values
        if ($points < 0) {
            throw new InvalidArgumentException('Points cannot be negative');
        }

        // Silently skip zero points
        if ($points === 0) {
            return null;
        }

        // Award points
        $studentPoints = StudentPoint::getOrCreate($student->id, $teacherId);

        return $studentPoints->addPoints(
            $points,
            $strategy->getTransactionType(),
            $strategy->getReferenceType($context),
            $strategy->getReferenceId($context),
            $strategy->generateDescription($context, $points)
        );
    }

    /**
     * Award points using a specific strategy type.
     */
    public function awardPointsWithType(
        Student $student,
        string $type,
        mixed $context,
        string $teacherId
    ): ?PointTransaction {
        $strategy = $this->getStrategy($type);

        if ($strategy === null) {
            throw new InvalidArgumentException("No strategy registered for type: {$type}");
        }

        return $this->awardPoints($student, $context, $teacherId);
    }

    /**
     * Calculate points without awarding them.
     */
    public function calculatePoints(Student $student, mixed $context, GamificationSetting $settings): int
    {
        $strategy = $this->findStrategyFor($context);

        if ($strategy === null) {
            return 0;
        }

        return $strategy->calculate($student, $context, $settings);
    }

    /**
     * Check if points have already been awarded for this context.
     */
    private function isDuplicate(
        Student $student,
        string $teacherId,
        PointCalculationStrategyInterface $strategy,
        mixed $context
    ): bool {
        $referenceType = $strategy->getReferenceType($context);
        $referenceId = $strategy->getReferenceId($context);

        if ($referenceType === null || $referenceId === null) {
            return false;
        }

        return PointTransaction::where('student_id', $student->id)
            ->where('teacher_id', $teacherId)
            ->where('reference_type', $referenceType)
            ->where('reference_id', $referenceId)
            ->where('type', $strategy->getTransactionType())
            ->exists();
    }

    /**
     * Extract teacher ID from context.
     */
    private function extractTeacherId(mixed $context): ?string
    {
        if (isset($context->teacher_id)) {
            return $context->teacher_id;
        }

        // For ExamResult, get teacher from exam
        if (method_exists($context, 'exam') && $context->exam) {
            return $context->exam->teacher_id ?? null;
        }

        return null;
    }

    /**
     * Get all registered strategies.
     *
     * @return array<string, PointCalculationStrategyInterface>
     */
    public function getStrategies(): array
    {
        return $this->strategies;
    }
}
