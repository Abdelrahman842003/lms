<?php

namespace Tests\Feature\Patterns;

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\TeacherProfile;
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
 */
class GamificationEdgeCaseTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\Cache::flush();
    }

    // ============================================
    // Negative Points Tests
    // ============================================

    public function test_negative_points_throw_exception_in_manual_bonus_strategy(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Bonus points cannot be negative');

        new ManualBonusStrategy(-100, 'Should fail');
    }

    public function test_manual_bonus_strategy_rejects_negative_one_point(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Bonus points cannot be negative');

        new ManualBonusStrategy(-1, 'Should fail');
    }

    public function test_manual_bonus_strategy_accepts_zero_points(): void
    {
        $strategy = new ManualBonusStrategy(0, 'Zero bonus');

        $this->assertInstanceOf(ManualBonusStrategy::class, $strategy);
    }

    public function test_manual_bonus_strategy_accepts_positive_points(): void
    {
        $strategy = new ManualBonusStrategy(100, 'Valid bonus');

        $this->assertInstanceOf(ManualBonusStrategy::class, $strategy);
    }

    public function test_manual_bonus_strategy_is_immutable(): void
    {
        $strategy = new ManualBonusStrategy(50, 'Test bonus');

        $this->assertFalse(method_exists($strategy, 'setPoints'));
        $this->assertFalse(method_exists($strategy, 'setDescription'));

        $reflection = new \ReflectionClass(ManualBonusStrategy::class);
        $pointsProperty = $reflection->getProperty('points');
        $descriptionProperty = $reflection->getProperty('description');

        $this->assertTrue($pointsProperty->isReadOnly());
        $this->assertTrue($descriptionProperty->isReadOnly());
    }

    // ============================================
    // Zero Points Tests
    // ============================================

    public function test_zero_points_return_zero_from_calculate(): void
    {
        $student = Student::factory()->create();
        $profile = TeacherProfile::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_profile_id' => $profile->id,
            'is_enabled' => true,
        ]);

        $strategy = new ManualBonusStrategy(0, 'Zero bonus');
        $points = $strategy->calculate($student, null, $settings);

        $this->assertEquals(0, $points);
    }

    public function test_point_calculator_skips_zero_points(): void
    {
        $student = Student::factory()->create();
        $profile = TeacherProfile::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_profile_id' => $profile->id,
            'is_enabled' => true,
        ]);

        $calculator = app(PointCalculator::class);

        $strategy = new ManualBonusStrategy(0, 'Zero bonus');
        $points = $strategy->calculate($student, null, $settings);

        $this->assertEquals(0, $points);
    }

    // ============================================
    // Boundary Tests
    // ============================================

    public function test_max_int_points_handled(): void
    {
        $maxPoints = PHP_INT_MAX;

        $strategy = new ManualBonusStrategy($maxPoints, 'Max bonus');

        $this->assertInstanceOf(ManualBonusStrategy::class, $strategy);

        $student = Student::factory()->create();
        $profile = TeacherProfile::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_profile_id' => $profile->id,
            'is_enabled' => true,
        ]);

        $points = $strategy->calculate($student, null, $settings);
        $this->assertEquals($maxPoints, $points);
    }

    public function test_large_points_handled(): void
    {
        $largePoints = 1_000_000;

        $strategy = new ManualBonusStrategy($largePoints, 'Large bonus');

        $student = Student::factory()->create();
        $profile = TeacherProfile::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_profile_id' => $profile->id,
            'is_enabled' => true,
        ]);

        $points = $strategy->calculate($student, null, $settings);
        $this->assertEquals($largePoints, $points);
    }

    public function test_single_point_handled(): void
    {
        $strategy = new ManualBonusStrategy(1, 'Single point');

        $student = Student::factory()->create();
        $profile = TeacherProfile::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_profile_id' => $profile->id,
            'is_enabled' => true,
        ]);

        $points = $strategy->calculate($student, null, $settings);
        $this->assertEquals(1, $points);
    }

    // ============================================
    // Factory Binding Tests
    // ============================================

    public function test_manual_bonus_strategy_is_not_singleton(): void
    {
        $strategy1 = app()->makeWith(ManualBonusStrategy::class, ['points' => 10]);
        $strategy2 = app()->makeWith(ManualBonusStrategy::class, ['points' => 20]);

        $this->assertNotSame($strategy1, $strategy2);
    }

    public function test_manual_bonus_strategy_resolved_with_parameters(): void
    {
        $strategy = app()->makeWith(ManualBonusStrategy::class, [
            'points' => 150,
            'description' => 'Custom bonus',
        ]);

        $student = Student::factory()->create();
        $profile = TeacherProfile::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_profile_id' => $profile->id,
            'is_enabled' => true,
        ]);

        $points = $strategy->calculate($student, null, $settings);
        $this->assertEquals(150, $points);
        $this->assertEquals('Custom bonus', $strategy->generateDescription(null, 150));
    }

    public function test_manual_bonus_strategy_uses_defaults(): void
    {
        $strategy = app(ManualBonusStrategy::class);

        $student = Student::factory()->create();
        $profile = TeacherProfile::factory()->create();
        $settings = GamificationSetting::factory()->create([
            'teacher_profile_id' => $profile->id,
            'is_enabled' => true,
        ]);

        $points = $strategy->calculate($student, null, $settings);
        $this->assertEquals(0, $points);
    }

    // ============================================
    // Description Edge Cases
    // ============================================

    public function test_empty_description_generates_default(): void
    {
        $strategy = new ManualBonusStrategy(100, '');

        $description = $strategy->generateDescription(null, 100);

        $this->assertStringContainsString('مكافأة يدوية', $description);
        $this->assertStringContainsString('100', $description);
    }

    public function test_custom_description_is_used(): void
    {
        $strategy = new ManualBonusStrategy(100, 'Excellent work!');

        $description = $strategy->generateDescription(null, 100);

        $this->assertEquals('Excellent work!', $description);
    }

    public function test_long_description_handled(): void
    {
        $longDescription = str_repeat('a', 1000);

        $strategy = new ManualBonusStrategy(100, $longDescription);

        $description = $strategy->generateDescription(null, 100);

        $this->assertEquals($longDescription, $description);
    }

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

    public function test_manual_bonus_strategy_supports_any_context(): void
    {
        $strategy = new ManualBonusStrategy(100, 'Test');

        $this->assertTrue($strategy->supports(null));
        $this->assertTrue($strategy->supports(new \stdClass()));
        $this->assertTrue($strategy->supports(['foo' => 'bar']));
    }

    public function test_manual_bonus_strategy_returns_correct_type(): void
    {
        $strategy = new ManualBonusStrategy(100, 'Test');

        $this->assertEquals(PointTransaction::TYPE_MANUAL_BONUS, $strategy->getTransactionType());
    }

    public function test_manual_bonus_strategy_returns_null_reference_type(): void
    {
        $strategy = new ManualBonusStrategy(100, 'Test');

        $this->assertNull($strategy->getReferenceType(null));
        $this->assertNull($strategy->getReferenceType(new \stdClass()));
    }

    public function test_manual_bonus_strategy_returns_null_reference_id(): void
    {
        $strategy = new ManualBonusStrategy(100, 'Test');

        $this->assertNull($strategy->getReferenceId(null));
        $this->assertNull($strategy->getReferenceId(new \stdClass()));
    }

    // ============================================
    // Concurrency/Duplicate Tests
    // ============================================

    public function test_duplicate_detection_prevents_double_award(): void
    {
        $student = Student::factory()->create();
        $profile = TeacherProfile::factory()->create();
        $group = Group::factory()->create(['teacher_profile_id' => $profile->id]);
        $lecture = Lecture::factory()->create([
            'teacher_profile_id' => $profile->id,
            'group_id' => $group->id,
        ]);

        $settings = GamificationSetting::factory()->create([
            'teacher_profile_id' => $profile->id,
            'is_enabled' => true,
            'attendance_points' => 10,
        ]);

        $calculator = app(PointCalculator::class);

        // First award should succeed
        $transaction1 = $calculator->awardPoints($student, $lecture, $profile->id);
        $this->assertNotNull($transaction1);

        // Second award for same lecture should be prevented (duplicate)
        $transaction2 = $calculator->awardPoints($student, $lecture, $profile->id);
        $this->assertNull($transaction2);
    }

    // ============================================
    // Settings Integration Tests
    // ============================================

    public function test_no_points_when_gamification_disabled(): void
    {
        $student = Student::factory()->create();
        $profile = TeacherProfile::factory()->create();
        $group = Group::factory()->create(['teacher_profile_id' => $profile->id]);
        $lecture = Lecture::factory()->create([
            'teacher_profile_id' => $profile->id,
            'group_id' => $group->id,
        ]);

        $settings = GamificationSetting::factory()->create([
            'teacher_profile_id' => $profile->id,
            'is_enabled' => false, // Disabled
            'attendance_points' => 10,
        ]);

        $calculator = app(PointCalculator::class);

        // Should return null because gamification is disabled
        $transaction = $calculator->awardPoints($student, $lecture, $profile->id);
        $this->assertNull($transaction);
    }

    public function test_points_awarded_when_gamification_enabled(): void
    {
        $student = Student::factory()->create();
        $profile = TeacherProfile::factory()->create();
        $lecture = Lecture::factory()->create(['teacher_profile_id' => $profile->id]);

        $settings = GamificationSetting::factory()->create([
            'teacher_profile_id' => $profile->id,
            'is_enabled' => true,
            'attendance_points' => 10,
        ]);

        $calculator = app(PointCalculator::class);

        // Should return transaction because gamification is enabled
        $transaction = $calculator->awardPoints($student, $lecture, $profile->id);
        $this->assertNotNull($transaction);
        $this->assertEquals(10, $transaction->points);
    }

    protected function tearDown(): void
    {
        parent::tearDown();
    }
}
