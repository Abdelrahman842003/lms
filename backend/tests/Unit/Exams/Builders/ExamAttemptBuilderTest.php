<?php

declare(strict_types=1);

namespace Tests\Unit\Exams\Builders;

use App\Domains\Exams\Actions\StartAttemptAction;
use App\Domains\Exams\Builders\ExamAttemptBuilder;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ExamAttemptBuilderTest extends TestCase
{
    #[Test]
    public function create_attempt_accepts_string_student_id(): void
    {
        $method = new \ReflectionMethod(ExamAttemptBuilder::class, 'createAttempt');
        $studentIdParam = $method->getParameters()[1];

        $this->assertSame('studentId', $studentIdParam->getName());
        $this->assertTrue($studentIdParam->hasType());
        $this->assertSame('string', (string) $studentIdParam->getType());
    }

    #[Test]
    public function start_attempt_action_accepts_string_student_id(): void
    {
        $method = new \ReflectionMethod(StartAttemptAction::class, 'execute');
        $studentIdParam = $method->getParameters()[1];

        $this->assertSame('studentId', $studentIdParam->getName());
        $this->assertTrue($studentIdParam->hasType());
        $this->assertSame('string', (string) $studentIdParam->getType());
    }
}
