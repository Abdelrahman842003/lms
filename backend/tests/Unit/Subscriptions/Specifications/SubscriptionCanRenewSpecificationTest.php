<?php

declare(strict_types=1);

namespace Tests\Unit\Subscriptions\Specifications;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Subscriptions\Specifications\SubscriptionCanRenewSpecification;
use App\Domains\Subscriptions\Specifications\AndSpecification;
use App\Domains\Subscriptions\Specifications\OrSpecification;
use App\Domains\Subscriptions\Specifications\NotSpecification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Specification Pattern Tests
 *
 * Tests the Specification Pattern implementation for subscription business rules.
 *
 * @see https://designpatternsphp.readthedocs.io/en/latest/Behavioral/Specification/ Specification Pattern
 */
class SubscriptionCanRenewSpecificationTest extends TestCase
{
    use RefreshDatabase;

    private SubscriptionCanRenewSpecification $specification;

    protected function setUp(): void
    {
        parent::setUp();
        $this->specification = new SubscriptionCanRenewSpecification();
    }

    #[Test]
    public function it_satisfies_academy_with_active_plan(): void
    {
        $academy = Academy::factory()->create([
            'plan_expires_at' => now()->addDays(30),
        ]);

        $result = $this->specification->isSatisfiedBy($academy);

        $this->assertTrue($result);
    }

    #[Test]
    public function it_satisfies_academy_within_grace_period(): void
    {
        $academy = Academy::factory()->create([
            'plan_expires_at' => now()->subDays(2), // Expired 2 days ago
        ]);

        $result = $this->specification->isSatisfiedBy($academy);

        $this->assertTrue($result, 'Academy should be renewable within 3-day grace period');
    }

    #[Test]
    public function it_rejects_academy_past_grace_period(): void
    {
        $academy = Academy::factory()->create([
            'plan_expires_at' => now()->subDays(5), // Expired 5 days ago
        ]);

        $result = $this->specification->isSatisfiedBy($academy);

        $this->assertFalse($result, 'Academy should not be renewable after grace period');
    }

    #[Test]
    public function it_satisfies_teacher_with_active_plan(): void
    {
        $teacher = Teacher::factory()->create([
            'plan_expires_at' => now()->addDays(30),
        ]);

        $result = $this->specification->isSatisfiedBy($teacher);

        $this->assertTrue($result);
    }

    #[Test]
    public function it_rejects_invalid_candidate_type(): void
    {
        $result = $this->specification->isSatisfiedBy('invalid');

        $this->assertFalse($result, 'Should reject non-Academy/Teacher candidates');
    }

    #[Test]
    public function and_specification_returns_true_when_both_satisfied(): void
    {
        $academy = Academy::factory()->create([
            'plan_expires_at' => now()->addDays(30),
        ]);

        $trueSpec = new class extends \App\Domains\Subscriptions\Specifications\AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return true;
            }
        };

        $andSpec = new AndSpecification($this->specification, $trueSpec);

        $result = $andSpec->isSatisfiedBy($academy);

        $this->assertTrue($result);
    }

    #[Test]
    public function or_specification_returns_true_when_either_satisfied(): void
    {
        $academy = Academy::factory()->create([
            'plan_expires_at' => now()->addDays(30),
        ]);

        $falseSpec = new class extends \App\Domains\Subscriptions\Specifications\AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return false;
            }
        };

        $orSpec = new OrSpecification($this->specification, $falseSpec);

        $result = $orSpec->isSatisfiedBy($academy);

        $this->assertTrue($result, 'OR should return true when left is satisfied');
    }

    #[Test]
    public function not_specification_negates_result(): void
    {
        $academy = Academy::factory()->create([
            'plan_expires_at' => now()->addDays(30),
        ]);

        $notSpec = new NotSpecification($this->specification);

        $result = $notSpec->isSatisfiedBy($academy);

        $this->assertFalse($result, 'NOT should negate true to false');
    }

    #[Test]
    public function composite_specification_chain(): void
    {
        $academy = Academy::factory()->create([
            'plan_expires_at' => now()->addDays(30),
        ]);

        $trueSpec = new class extends \App\Domains\Subscriptions\Specifications\AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return true;
            }
        };

        // (specification AND true) OR false = true
        $composite = $this->specification
            ->and($trueSpec)
            ->or($trueSpec);

        $result = $composite->isSatisfiedBy($academy);

        $this->assertTrue($result);
    }
}
