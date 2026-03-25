<?php

namespace Tests\Feature\Patterns;

use App\Domains\Gamification\Services\PointCalculator;
use App\Domains\Gamification\Strategies\PointCalculationStrategyInterface;
use App\Domains\Gamification\Strategies\AttendancePointStrategy;
use App\Domains\Gamification\Strategies\ExamPointStrategy;
use App\Domains\Gamification\Strategies\VideoPointStrategy;
use App\Domains\Gamification\Strategies\ManualBonusStrategy;
use App\Domains\Gamification\Strategies\XpCalculationStrategy;
use App\Domains\Gamification\Strategies\AttendanceXpCalculator;
use App\Domains\Gamification\Strategies\ExamXpCalculator;
use App\Domains\Gamification\Strategies\MistakeReviewXpCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Integration tests for the Strategy Pattern implementation.
 *
 * Tests verify that:
 * - PointCalculator can be resolved from the container
 * - Point calculation strategies are properly registered
 * - XP calculation strategies implement the correct interface
 * - Correct strategy is selected based on context
 */
class StrategyPatternTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that PointCalculator can be resolved from the container.
     */
    public function test_point_calculator_can_be_resolved_from_container(): void
    {
        $calculator = app(PointCalculator::class);

        $this->assertInstanceOf(PointCalculator::class, $calculator);
    }

    /**
     * Test that PointCalculator is registered as a singleton.
     */
    public function test_point_calculator_is_singleton(): void
    {
        $calculator1 = app(PointCalculator::class);
        $calculator2 = app(PointCalculator::class);

        $this->assertSame($calculator1, $calculator2);
    }

    /**
     * Test that AttendancePointStrategy implements PointCalculationStrategyInterface.
     */
    public function test_attendance_point_strategy_implements_interface(): void
    {
        $strategy = app(AttendancePointStrategy::class);

        $this->assertInstanceOf(PointCalculationStrategyInterface::class, $strategy);
    }

    /**
     * Test that ExamPointStrategy implements PointCalculationStrategyInterface.
     */
    public function test_exam_point_strategy_implements_interface(): void
    {
        $strategy = app(ExamPointStrategy::class);

        $this->assertInstanceOf(PointCalculationStrategyInterface::class, $strategy);
    }

    /**
     * Test that VideoPointStrategy implements PointCalculationStrategyInterface.
     */
    public function test_video_point_strategy_implements_interface(): void
    {
        $strategy = app(VideoPointStrategy::class);

        $this->assertInstanceOf(PointCalculationStrategyInterface::class, $strategy);
    }

    /**
     * Test that ManualBonusStrategy implements PointCalculationStrategyInterface.
     */
    public function test_manual_bonus_strategy_implements_interface(): void
    {
        $strategy = app(ManualBonusStrategy::class);

        $this->assertInstanceOf(PointCalculationStrategyInterface::class, $strategy);
    }

    /**
     * Test that strategies can be resolved from container.
     */
    public function test_strategies_can_be_resolved_from_container(): void
    {
        // All point strategies should be resolvable
        $attendanceStrategy = app(AttendancePointStrategy::class);
        $examStrategy = app(ExamPointStrategy::class);
        $videoStrategy = app(VideoPointStrategy::class);
        $manualStrategy = app(ManualBonusStrategy::class);

        $this->assertNotNull($attendanceStrategy);
        $this->assertNotNull($examStrategy);
        $this->assertNotNull($videoStrategy);
        $this->assertNotNull($manualStrategy);
    }

    /**
     * Test that AttendanceXpCalculator implements XpCalculationStrategy.
     */
    public function test_attendance_xp_calculator_implements_interface(): void
    {
        $calculator = app(AttendanceXpCalculator::class);

        $this->assertInstanceOf(XpCalculationStrategy::class, $calculator);
    }

    /**
     * Test that ExamXpCalculator implements XpCalculationStrategy.
     */
    public function test_exam_xp_calculator_implements_interface(): void
    {
        $calculator = app(ExamXpCalculator::class);

        $this->assertInstanceOf(XpCalculationStrategy::class, $calculator);
    }

    /**
     * Test that MistakeReviewXpCalculator implements XpCalculationStrategy.
     */
    public function test_mistake_review_xp_calculator_implements_interface(): void
    {
        $calculator = app(MistakeReviewXpCalculator::class);

        $this->assertInstanceOf(XpCalculationStrategy::class, $calculator);
    }

    /**
     * Test that XP calculators can be resolved from container.
     */
    public function test_xp_calculators_can_be_resolved_from_container(): void
    {
        $attendanceXp = app(AttendanceXpCalculator::class);
        $examXp = app(ExamXpCalculator::class);
        $mistakeReviewXp = app(MistakeReviewXpCalculator::class);

        $this->assertNotNull($attendanceXp);
        $this->assertNotNull($examXp);
        $this->assertNotNull($mistakeReviewXp);
    }

    /**
     * Test that PointCalculator has strategies registered.
     */
    public function test_point_calculator_has_strategies_registered(): void
    {
        $calculator = app(PointCalculator::class);

        // Use reflection to check registered strategies
        $reflection = new \ReflectionClass($calculator);
        $property = $reflection->getProperty('strategies');
        $property->setAccessible(true);
        $strategies = $property->getValue($calculator);

        $this->assertNotEmpty($strategies, 'PointCalculator should have strategies registered');
        $this->assertGreaterThanOrEqual(4, $strategies, 'PointCalculator should have at least 4 strategies');
    }

    /**
     * Test that point strategies have correct transaction types.
     */
    public function test_point_strategies_have_transaction_types(): void
    {
        $attendanceStrategy = app(AttendancePointStrategy::class);
        $examStrategy = app(ExamPointStrategy::class);
        $videoStrategy = app(VideoPointStrategy::class);
        $manualStrategy = app(ManualBonusStrategy::class);

        // Each strategy should return a non-empty transaction type
        $this->assertNotEmpty($attendanceStrategy->getTransactionType());
        $this->assertNotEmpty($examStrategy->getTransactionType());
        $this->assertNotEmpty($videoStrategy->getTransactionType());
        $this->assertNotEmpty($manualStrategy->getTransactionType());

        // Transaction types should be unique
        $types = [
            $attendanceStrategy->getTransactionType(),
            $examStrategy->getTransactionType(),
            $videoStrategy->getTransactionType(),
            $manualStrategy->getTransactionType(),
        ];

        $uniqueTypes = array_unique($types);
        $this->assertCount(
            count($types),
            $uniqueTypes,
            'Each strategy should have a unique transaction type'
        );
    }

    /**
     * Test that strategies support their respective context types.
     */
    public function test_strategies_support_their_context_types(): void
    {
        $attendanceStrategy = app(AttendancePointStrategy::class);
        $examStrategy = app(ExamPointStrategy::class);
        $videoStrategy = app(VideoPointStrategy::class);

        // Attendance strategy should support Lecture context
        $this->assertTrue(
            $attendanceStrategy->supports($this->createMock(\App\Domains\Lectures\Models\Lecture::class))
        );

        // Video strategy should support Video context
        $this->assertTrue(
            $videoStrategy->supports($this->createMock(\App\Domains\Videos\Models\Video::class))
        );
    }
}
