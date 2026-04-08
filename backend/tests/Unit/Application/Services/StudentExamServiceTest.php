<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Services;

use App\Domains\Application\Services\Student\StudentExamService;
use App\Domains\Exams\Models\Exam;
use App\Domains\Exams\Models\ExamAttempt;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class StudentExamServiceTest extends TestCase
{
    #[Test]
    public function calculate_time_remaining_returns_int_for_decimal_duration(): void
    {
        $service = (new \ReflectionClass(StudentExamService::class))->newInstanceWithoutConstructor();

        $exam = new Exam([
            'duration' => 1.5, // 90 seconds
        ]);

        $attempt = new ExamAttempt([
            'started_at' => now()->subSeconds(10),
        ]);
        $attempt->setRelation('exam', $exam);

        $method = new \ReflectionMethod(StudentExamService::class, 'calculateTimeRemaining');
        $method->setAccessible(true);

        $result = $method->invoke($service, $attempt);

        $this->assertIsInt($result);
        $this->assertGreaterThanOrEqual(79, $result);
        $this->assertLessThanOrEqual(81, $result);
    }

    #[Test]
    public function it_exposes_exam_lifecycle_methods_used_by_controller(): void
    {
        $requiredMethods = [
            'submitAnswer',
            'skipQuestion',
            'terminateExam',
            'getResult',
            'getAttemptData',
        ];

        foreach ($requiredMethods as $methodName) {
            $this->assertTrue(method_exists(StudentExamService::class, $methodName), "Missing method: {$methodName}");

            $reflection = new \ReflectionMethod(StudentExamService::class, $methodName);
            $this->assertTrue($reflection->isPublic(), "Method must be public: {$methodName}");
        }
    }
}
