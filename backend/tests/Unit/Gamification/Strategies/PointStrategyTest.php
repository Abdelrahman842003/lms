<?php

declare(strict_types=1);

namespace Tests\Unit\Gamification\Strategies;

use App\Domains\Auth\Models\Student;
use App\Domains\Exams\Models\ExamResult;
use App\Domains\Gamification\Models\GamificationSetting;
use App\Domains\Gamification\Models\PointTransaction;
use App\Domains\Gamification\Services\PointCalculator;
use App\Domains\Gamification\Strategies\AttendancePointStrategy;
use App\Domains\Gamification\Strategies\ExamPointStrategy;
use App\Domains\Gamification\Strategies\ManualBonusStrategy;
use App\Domains\Gamification\Strategies\PointCalculationStrategyInterface;
use App\Domains\Gamification\Strategies\VideoPointStrategy;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Videos\Models\Video;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Test suite for the Strategy Pattern implementation in Gamification.
 * 
 * @see https://refactoring.guru/design-patterns/strategy
 */
class PointStrategyTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    private function createSettings(array $overrides = []): GamificationSetting
    {
        $settings = Mockery::mock(GamificationSetting::class);
        $settings->is_enabled = $overrides['is_enabled'] ?? true;
        $settings->attendance_points = $overrides['attendance_points'] ?? 10;
        $settings->video_points = $overrides['video_points'] ?? 5;
        
        $settings->shouldReceive('calculateExamPoints')
            ->andReturnUsing(fn($percentage) => (int) ($percentage * 0.5));
        
        return $settings;
    }

    #[Test]
    public function attendance_strategy_supports_lecture_context(): void
    {
        $strategy = new AttendancePointStrategy();
        $lecture = Mockery::mock(Lecture::class);
        $examResult = Mockery::mock(ExamResult::class);

        $this->assertTrue($strategy->supports($lecture));
        $this->assertFalse($strategy->supports($examResult));
    }

    #[Test]
    public function exam_strategy_supports_exam_result_context(): void
    {
        $strategy = new ExamPointStrategy();
        $examResult = Mockery::mock(ExamResult::class);
        $lecture = Mockery::mock(Lecture::class);

        $this->assertTrue($strategy->supports($examResult));
        $this->assertFalse($strategy->supports($lecture));
    }

    #[Test]
    public function video_strategy_supports_video_context(): void
    {
        $strategy = new VideoPointStrategy();
        $video = Mockery::mock(Video::class);
        $lecture = Mockery::mock(Lecture::class);

        $this->assertTrue($strategy->supports($video));
        $this->assertFalse($strategy->supports($lecture));
    }

    #[Test]
    public function manual_bonus_strategy_supports_any_context(): void
    {
        $strategy = new ManualBonusStrategy();
        
        $this->assertTrue($strategy->supports(null));
        $this->assertTrue($strategy->supports(Mockery::mock(Lecture::class)));
        $this->assertTrue($strategy->supports(Mockery::mock(ExamResult::class)));
    }

    #[Test]
    public function attendance_strategy_calculates_points_from_settings(): void
    {
        $strategy = new AttendancePointStrategy();
        $student = Mockery::mock(Student::class);
        $lecture = Mockery::mock(Lecture::class);
        $settings = $this->createSettings(['attendance_points' => 15]);

        $points = $strategy->calculate($student, $lecture, $settings);

        $this->assertEquals(15, $points);
    }

    #[Test]
    public function exam_strategy_calculates_points_based_on_percentage(): void
    {
        $strategy = new ExamPointStrategy();
        $student = Mockery::mock(Student::class);
        
        $examResult = Mockery::mock(ExamResult::class);
        $examResult->percentage = 80;
        
        $settings = $this->createSettings();

        $points = $strategy->calculate($student, $examResult, $settings);

        // 80 * 0.5 = 40
        $this->assertEquals(40, $points);
    }

    #[Test]
    public function video_strategy_calculates_points_from_settings(): void
    {
        $strategy = new VideoPointStrategy();
        $student = Mockery::mock(Student::class);
        $video = Mockery::mock(Video::class);
        $settings = $this->createSettings(['video_points' => 20]);

        $points = $strategy->calculate($student, $video, $settings);

        $this->assertEquals(20, $points);
    }

    #[Test]
    public function manual_bonus_strategy_returns_configured_points(): void
    {
        $strategy = new ManualBonusStrategy(50, 'Test bonus');
        $student = Mockery::mock(Student::class);
        $settings = $this->createSettings();

        $points = $strategy->calculate($student, null, $settings);

        $this->assertEquals(50, $points);
    }

    #[Test]
    public function manual_bonus_strategy_is_immutable(): void
    {
        // ManualBonusStrategy is now immutable - points and description must be set via constructor
        $strategy = new ManualBonusStrategy(100, 'Special bonus');
        
        $this->assertEquals(100, $strategy->calculate(Mockery::mock(Student::class), null, $this->createSettings()));
        $this->assertEquals('Special bonus', $strategy->generateDescription(null, 100));
        
        // Verify setter methods no longer exist
        $this->assertFalse(method_exists($strategy, 'setPoints'));
        $this->assertFalse(method_exists($strategy, 'setDescription'));
    }

    #[Test]
    public function strategies_return_correct_transaction_types(): void
    {
        $this->assertEquals(PointTransaction::TYPE_ATTENDANCE, (new AttendancePointStrategy())->getTransactionType());
        $this->assertEquals(PointTransaction::TYPE_EXAM_SCORE, (new ExamPointStrategy())->getTransactionType());
        $this->assertEquals(PointTransaction::TYPE_VIDEO, (new VideoPointStrategy())->getTransactionType());
        $this->assertEquals(PointTransaction::TYPE_MANUAL_BONUS, (new ManualBonusStrategy())->getTransactionType());
    }

    #[Test]
    public function attendance_strategy_generates_lecture_description(): void
    {
        $strategy = new AttendancePointStrategy();
        
        $lecture = Mockery::mock(Lecture::class);
        $lecture->title = 'Test Lecture';
        
        $description = $strategy->generateDescription($lecture, 10);

        $this->assertStringContainsString('Test Lecture', $description);
    }

    #[Test]
    public function exam_strategy_generates_exam_description(): void
    {
        $strategy = new ExamPointStrategy();
        
        $exam = Mockery::mock(\App\Domains\Exams\Models\Exam::class);
        $exam->title = 'Final Exam';
        
        $examResult = Mockery::mock(ExamResult::class);
        $examResult->exam = $exam;
        $examResult->percentage = 95;
        
        $description = $strategy->generateDescription($examResult, 47);

        $this->assertStringContainsString('Final Exam', $description);
        $this->assertStringContainsString('95', $description);
    }

    #[Test]
    public function point_calculator_registers_strategies(): void
    {
        $calculator = new PointCalculator();
        
        $calculator->registerStrategy(new AttendancePointStrategy());
        $calculator->registerStrategy(new ExamPointStrategy());
        
        $strategies = $calculator->getStrategies();

        $this->assertCount(2, $strategies);
        $this->assertArrayHasKey(PointTransaction::TYPE_ATTENDANCE, $strategies);
        $this->assertArrayHasKey(PointTransaction::TYPE_EXAM_SCORE, $strategies);
    }

    #[Test]
    public function point_calculator_finds_strategy_by_type(): void
    {
        $calculator = new PointCalculator();
        $attendanceStrategy = new AttendancePointStrategy();
        
        $calculator->registerStrategy($attendanceStrategy);
        
        $found = $calculator->getStrategy(PointTransaction::TYPE_ATTENDANCE);

        $this->assertSame($attendanceStrategy, $found);
    }

    #[Test]
    public function point_calculator_finds_strategy_for_context(): void
    {
        $calculator = new PointCalculator();
        $calculator->registerStrategy(new AttendancePointStrategy());
        $calculator->registerStrategy(new ExamPointStrategy());
        
        $lecture = Mockery::mock(Lecture::class);
        $examResult = Mockery::mock(ExamResult::class);
        
        $lectureStrategy = $calculator->findStrategyFor($lecture);
        $examStrategy = $calculator->findStrategyFor($examResult);

        $this->assertInstanceOf(AttendancePointStrategy::class, $lectureStrategy);
        $this->assertInstanceOf(ExamPointStrategy::class, $examStrategy);
    }

    #[Test]
    public function point_calculator_returns_null_for_unsupported_context(): void
    {
        $calculator = new PointCalculator();
        $calculator->registerStrategy(new AttendancePointStrategy());
        
        $unsupportedContext = new \stdClass();
        
        $strategy = $calculator->findStrategyFor($unsupportedContext);

        $this->assertNull($strategy);
    }

    #[Test]
    public function point_calculator_calculates_points_without_awarding(): void
    {
        $calculator = new PointCalculator();
        $calculator->registerStrategy(new AttendancePointStrategy());
        
        $student = Mockery::mock(Student::class);
        $lecture = Mockery::mock(Lecture::class);
        $settings = $this->createSettings(['attendance_points' => 25]);
        
        $points = $calculator->calculatePoints($student, $lecture, $settings);

        $this->assertEquals(25, $points);
    }

    #[Test]
    public function strategies_return_correct_reference_types(): void
    {
        $attendanceStrategy = new AttendancePointStrategy();
        $examStrategy = new ExamPointStrategy();
        $videoStrategy = new VideoPointStrategy();
        $manualStrategy = new ManualBonusStrategy();
        
        $lecture = Mockery::mock(Lecture::class);
        $examResult = Mockery::mock(ExamResult::class);
        $video = Mockery::mock(Video::class);
        
        $this->assertEquals(Lecture::class, $attendanceStrategy->getReferenceType($lecture));
        $this->assertEquals(ExamResult::class, $examStrategy->getReferenceType($examResult));
        $this->assertEquals(Video::class, $videoStrategy->getReferenceType($video));
        $this->assertNull($manualStrategy->getReferenceType(null));
    }

    #[Test]
    public function strategies_return_correct_reference_ids(): void
    {
        $attendanceStrategy = new AttendancePointStrategy();
        $examStrategy = new ExamPointStrategy();
        $videoStrategy = new VideoPointStrategy();
        $manualStrategy = new ManualBonusStrategy();
        
        $lecture = Mockery::mock(Lecture::class);
        $lecture->id = 'lecture-123';
        
        $examResult = Mockery::mock(ExamResult::class);
        $examResult->id = 'exam-456';
        
        $video = Mockery::mock(Video::class);
        $video->id = 'video-789';
        
        $this->assertEquals('lecture-123', $attendanceStrategy->getReferenceId($lecture));
        $this->assertEquals('exam-456', $examStrategy->getReferenceId($examResult));
        $this->assertEquals('video-789', $videoStrategy->getReferenceId($video));
        $this->assertNull($manualStrategy->getReferenceId(null));
    }

    #[Test]
    public function unsupported_context_returns_zero_points(): void
    {
        $strategy = new AttendancePointStrategy();
        $student = Mockery::mock(Student::class);
        $settings = $this->createSettings();
        
        $unsupportedContext = new \stdClass();
        
        $points = $strategy->calculate($student, $unsupportedContext, $settings);

        $this->assertEquals(0, $points);
    }
}
