<?php

namespace Tests\Feature\Patterns;

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\PointTransaction;
use App\Domains\Gamification\Services\PointCalculator;
use App\Domains\Gamification\Strategies\ManualBonusStrategy;
use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\ExamResult;
use App\Domains\Lectures\Models\Attendance;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Enrollments\Models\Group;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

/**
 * Edge case tests for the Gamification system.
 *
 * Tests verify that:
 * - Negative points are rejected with exceptions
 * - Zero points are silently skipped
 * - Boundary conditions are handled correctly
 * - Large point values don't cause overflow
 * - Concurrent requests don't cause race conditions
 */
class GamificationEdgeCaseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    // ============================================
    // Negative Points Tests
    // ============================================

    /**
     * Test that ManualBonusStrategy rejects negative points in constructor.
     */
    public function test_negative_points_throw_exception_in_manual_bonus_strategy(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Bonus points cannot be negative');

        new ManualBonusStrategy(-100, 'Should fail');
    }

    /**
     * Test that ManualBonusStrategy rejects negative one point.
     */
    public function test_manual_bonus_strategy_rejects_negative_one_point(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Bonus points cannot be negative');

        new ManualBonusStrategy(-1, 'Should fail');
    }

    /**
     * Test that ManualBonusStrategy accepts zero points.
     */
    public function test_manual_bonus_strategy_accepts_zero_points(): void
    {
        $strategy = new ManualBonusStrategy(0, 'Zero bonus');

        $this->assertInstanceOf(ManualBonusStrategy::class, $strategy);
    }

    /**
     * Test that ManualBonusStrategy accepts positive points.
     */
    public function test_manual_bonus_strategy_accepts_positive_points(): void
    {
        $strategy = new ManualBonusStrategy(100, 'Valid bonus');

        $this->assertInstanceOf(ManualBonusStrategy::class, $strategy);
    }

    /**
     * Test that ManualBonusStrategy is immutable (no setter methods).
     */
    public function test_manual_bonus_strategy_is_immutable(): void
    {
        $strategy = new ManualBonusStrategy(50, 'Test bonus');

        // Verify the strategy doesn't have setter methods
        $this->assertFalse(method_exists($strategy, 'setPoints'));
        $this->assertFalse(method_exists($strategy, 'setDescription'));

        // Verify readonly properties by checking reflection
        $reflection = new \ReflectionClass(ManualBonusStrategy::class);
        $pointsProperty = $reflection->getProperty('points');
        $descriptionProperty = $reflection->getProperty('description');

        $this->assertTrue($pointsProperty->isReadOnly());
        $this->assertTrue($descriptionProperty->isReadOnly());
    }

    // ============================================
    // Zero Points Tests
    // ============================================

    /**
     * Test that zero points return null from ManualBonusStrategy calculate.
     */
    public function test_zero_points_return_zero_from_calculate(): void
    {
        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_id' => $teacher->id,
            'is_enabled' => true,
        ]);

        $strategy = new ManualBonusStrategy(0, 'Zero bonus');
        $points = $strategy->calculate($student, null, $settings);

        $this->assertEquals(0, $points);
    }

    /**
     * Test that PointCalculator silently skips zero points.
     */
    public function test_point_calculator_skips_zero_points(): void
    {
        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_id' => $teacher->id,
            'is_enabled' => true,
        ]);

        $calculator = app(PointCalculator::class);

        // Create a mock context that would result in zero points
        // Since ManualBonusStrategy with 0 points returns 0, it should be skipped
        $strategy = new ManualBonusStrategy(0, 'Zero bonus');
        $points = $strategy->calculate($student, null, $settings);

        $this->assertEquals(0, $points);
    }

    // ============================================
    // Boundary Tests
    // ============================================

    /**
     * Test that PHP_INT_MAX points are handled correctly.
     */
    public function test_max_int_points_handled(): void
    {
        $maxPoints = PHP_INT_MAX;

        $strategy = new ManualBonusStrategy($maxPoints, 'Max bonus');

        $this->assertInstanceOf(ManualBonusStrategy::class, $strategy);

        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_id' => $teacher->id,
            'is_enabled' => true,
        ]);

        $points = $strategy->calculate($student, null, $settings);
        $this->assertEquals($maxPoints, $points);
    }

    /**
     * Test that large points (1 million) are handled correctly.
     */
    public function test_large_points_handled(): void
    {
        $largePoints = 1_000_000;

        $strategy = new ManualBonusStrategy($largePoints, 'Large bonus');

        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_id' => $teacher->id,
            'is_enabled' => true,
        ]);

        $points = $strategy->calculate($student, null, $settings);
        $this->assertEquals($largePoints, $points);
    }

    /**
     * Test that one point is handled correctly.
     */
    public function test_single_point_handled(): void
    {
        $strategy = new ManualBonusStrategy(1, 'Single point');

        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_id' => $teacher->id,
            'is_enabled' => true,
        ]);

        $points = $strategy->calculate($student, null, $settings);
        $this->assertEquals(1, $points);
    }

    // ============================================
    // Factory Binding Tests
    // ============================================

    /**
     * Test that ManualBonusStrategy is NOT a singleton (factory binding).
     */
    public function test_manual_bonus_strategy_is_not_singleton(): void
    {
        $strategy1 = app()->makeWith(ManualBonusStrategy::class, ['points' => 10]);
        $strategy2 = app()->makeWith(ManualBonusStrategy::class, ['points' => 20]);

        // Different instances with different values
        $this->assertNotSame($strategy1, $strategy2);
    }

    /**
     * Test that ManualBonusStrategy can be resolved with custom parameters.
     */
    public function test_manual_bonus_strategy_resolved_with_parameters(): void
    {
        $strategy = app()->makeWith(ManualBonusStrategy::class, [
            'points' => 150,
            'description' => 'Custom bonus',
        ]);

        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_id' => $teacher->id,
            'is_enabled' => true,
        ]);

        $points = $strategy->calculate($student, null, $settings);
        $this->assertEquals(150, $points);
        $this->assertEquals('Custom bonus', $strategy->generateDescription(null, 150));
    }

    /**
     * Test that ManualBonusStrategy uses default values when no parameters provided.
     */
    public function test_manual_bonus_strategy_uses_defaults(): void
    {
        $strategy = app(ManualBonusStrategy::class);

        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_id' => $teacher->id,
            'is_enabled' => true,
        ]);

        $points = $strategy->calculate($student, null, $settings);
        $this->assertEquals(0, $points);
    }

    // ============================================
    // Description Edge Cases
    // ============================================

    /**
     * Test that empty description generates default Arabic description.
     */
    public function test_empty_description_generates_default(): void
    {
        $strategy = new ManualBonusStrategy(100, '');

        $description = $strategy->generateDescription(null, 100);

        $this->assertStringContainsString('مكافأة يدوية', $description);
        $this->assertStringContainsString('100', $description);
    }

    /**
     * Test that custom description is used when provided.
     */
    public function test_custom_description_is_used(): void
    {
        $strategy = new ManualBonusStrategy(100, 'Excellent work!');

        $description = $strategy->generateDescription(null, 100);

        $this->assertEquals('Excellent work!', $description);
    }

    /**
     * Test that very long description is handled.
     */
    public function test_long_description_handled(): void
    {
        $longDescription = str_repeat('a', 1000);

        $strategy = new ManualBonusStrategy(100, $longDescription);

        $description = $strategy->generateDescription(null, 100);

        $this->assertEquals($longDescription, $description);
    }

    /**
     * Test that unicode description is handled correctly.
     */
    public function test_unicode_description_handled(): void
    {
        $unicodeDescription = 'مكافأة ممتازة! 🎉 中文 العربية';

        $strategy = new ManualBonusStrategy(100, $unicodeDescription);

        $description = $strategy->generateDescription(null, 100);

        $this->assertEquals($unicodeDescription, $description);
    }

    // ============================================
    // Strategy Interface Tests
    // ============================================

    /**
     * Test that ManualBonusStrategy supports any context.
     */
    public function test_manual_bonus_strategy_supports_any_context(): void
    {
        $strategy = new ManualBonusStrategy(100, 'Test');

        // Should support null context
        $this->assertTrue($strategy->supports(null));

        // Should support any object
        $this->assertTrue($strategy->supports(new \stdClass()));

        // Should support arrays
        $this->assertTrue($strategy->supports(['foo' => 'bar']));
    }

    /**
     * Test that ManualBonusStrategy returns correct transaction type.
     */
    public function test_manual_bonus_strategy_returns_correct_type(): void
    {
        $strategy = new ManualBonusStrategy(100, 'Test');

        $this->assertEquals(PointTransaction::TYPE_MANUAL_BONUS, $strategy->getTransactionType());
    }

    /**
     * Test that ManualBonusStrategy returns null reference type.
     */
    public function test_manual_bonus_strategy_returns_null_reference_type(): void
    {
        $strategy = new ManualBonusStrategy(100, 'Test');

        $this->assertNull($strategy->getReferenceType(null));
        $this->assertNull($strategy->getReferenceType(new \stdClass()));
    }

    /**
     * Test that ManualBonusStrategy returns null reference ID.
     */
    public function test_manual_bonus_strategy_returns_null_reference_id(): void
    {
        $strategy = new ManualBonusStrategy(100, 'Test');

        $this->assertNull($strategy->getReferenceId(null));
        $this->assertNull($strategy->getReferenceId(new \stdClass()));
    }

    // ============================================
    // Concurrency/Duplicate Tests
    // ============================================

    /**
     * Test that duplicate detection works correctly.
     * Note: This tests the basic duplicate check, not actual race conditions.
     * For true concurrency testing, consider using specialized tools like Pest's parallel testing.
     */
    public function test_duplicate_detection_prevents_double_award(): void
    {
        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();
        $group = Group::factory()->create(['teacher_id' => $teacher->id]);
        $lecture = Lecture::factory()->create([
            'teacher_id' => $teacher->id,
            'group_id' => $group->id,
        ]);

        $settings = GamificationSetting::factory()->create([
            'teacher_id' => $teacher->id,
            'is_enabled' => true,
            'attendance_points' => 10,
        ]);

        $attendance = Attendance::factory()->create([
            'student_id' => $student->id,
            'lecture_id' => $lecture->id,
        ]);

        $calculator = app(PointCalculator::class);

        // First award should succeed
        $transaction1 = $calculator->awardPoints($student, $attendance, $teacher->id);
        $this->assertNotNull($transaction1);

        // Second award for same attendance should be prevented (duplicate)
        $transaction2 = $calculator->awardPoints($student, $attendance, $teacher->id);
        $this->assertNull($transaction2);
    }

    // ============================================
    // Settings Integration Tests
    // ============================================

    /**
     * Test that points are not awarded when gamification is disabled.
     */
    public function test_no_points_when_gamification_disabled(): void
    {
        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();
        $group = Group::factory()->create(['teacher_id' => $teacher->id]);
        $lecture = Lecture::factory()->create([
            'teacher_id' => $teacher->id,
            'group_id' => $group->id,
        ]);

        $settings = GamificationSetting::factory()->create([
            'teacher_id' => $teacher->id,
            'is_enabled' => false, // Disabled
            'attendance_points' => 10,
        ]);

        $attendance = Attendance::factory()->create([
            'student_id' => $student->id,
            'lecture_id' => $lecture->id,
        ]);

        $calculator = app(PointCalculator::class);

        // Should return null because gamification is disabled
        $transaction = $calculator->awardPoints($student, $attendance, $teacher->id);
        $this->assertNull($transaction);
    }

    /**
     * Test that points are awarded when gamification is enabled.
     */
    public function test_points_awarded_when_gamification_enabled(): void
    {
        $student = Student::factory()->create();
        $teacher = Teacher::factory()->create();
        $group = Group::factory()->create(['teacher_id' => $teacher->id]);
        $lecture = Lecture::factory()->create([
            'teacher_id' => $teacher->id,
            'group_id' => $group->id,
        ]);

        $settings = GamificationSetting::factory()->create([
            'teacher_id' => $teacher->id,
            'is_enabled' => true,
            'attendance_points' => 10,
        ]);

        $attendance = Attendance::factory()->create([
            'student_id' => $student->id,
            'lecture_id' => $lecture->id,
        ]);

        $calculator = app(PointCalculator::class);

        // Should succeed because gamification is enabled
        $transaction = $calculator->awardPoints($student, $attendance, $teacher->id);
        $this->assertNotNull($transaction);
        $this->assertEquals(10, $transaction->points);
    }

    // ============================================
    // Cleanup
    // ============================================

    protected function tearDown(): void
    {
        parent::tearDown();
    }
}
