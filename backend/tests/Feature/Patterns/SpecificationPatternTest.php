<?php

namespace Tests\Feature\Patterns;

use App\Domains\Subscriptions\Specifications\AbstractSpecification;
use App\Domains\Subscriptions\Specifications\AndSpecification;
use App\Domains\Subscriptions\Specifications\NotSpecification;
use App\Domains\Subscriptions\Specifications\OrSpecification;
use App\Domains\Subscriptions\Specifications\PlanActive;
use App\Domains\Subscriptions\Specifications\SeatAvailable;
use App\Domains\Subscriptions\Specifications\SpecificationInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Integration tests for the Specification Pattern implementation.
 *
 * Tests verify that:
 * - Concrete specifications (PlanActive, SeatAvailable) work correctly
 * - Composite specifications (And, Or, Not) work correctly
 * - Specifications can be composed using fluent interface
 */
class SpecificationPatternTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that PlanActive specification extends AbstractSpecification.
     */
    public function test_plan_active_specification_extends_abstract(): void
    {
        $spec = new PlanActive();

        $this->assertInstanceOf(AbstractSpecification::class, $spec);
        $this->assertInstanceOf(SpecificationInterface::class, $spec);
    }

    /**
     * Test that SeatAvailable specification extends AbstractSpecification.
     */
    public function test_seat_available_specification_extends_abstract(): void
    {
        $spec = new SeatAvailable();

        $this->assertInstanceOf(AbstractSpecification::class, $spec);
        $this->assertInstanceOf(SpecificationInterface::class, $spec);
    }

    /**
     * Test that PlanActive returns false for non-existent subscription.
     */
    public function test_plan_active_returns_false_for_non_existent_subscription(): void
    {
        $spec = new PlanActive();

        $result = $spec->isSatisfiedBy(['subscriberId' => 999, 'subscriberType' => 'teacher']);

        $this->assertFalse($result);
    }

    /**
     * Test that SeatAvailable returns false for non-existent subscription.
     */
    public function test_seat_available_returns_false_for_non_existent_subscription(): void
    {
        $spec = new SeatAvailable();

        $result = $spec->isSatisfiedBy(['subscriberId' => 999, 'subscriberType' => 'teacher']);

        $this->assertFalse($result);
    }

    /**
     * Test AND composition creates AndSpecification.
     */
    public function test_and_composition_creates_and_specification(): void
    {
        $planActive = new PlanActive();
        $seatAvailable = new SeatAvailable();

        $combined = $planActive->and($seatAvailable);

        $this->assertInstanceOf(AndSpecification::class, $combined);
    }

    /**
     * Test OR composition creates OrSpecification.
     */
    public function test_or_composition_creates_or_specification(): void
    {
        $planActive = new PlanActive();
        $seatAvailable = new SeatAvailable();

        $combined = $planActive->or($seatAvailable);

        $this->assertInstanceOf(OrSpecification::class, $combined);
    }

    /**
     * Test NOT composition creates NotSpecification.
     */
    public function test_not_composition_creates_not_specification(): void
    {
        $planActive = new PlanActive();

        $negated = $planActive->not();

        $this->assertInstanceOf(NotSpecification::class, $negated);
    }

    /**
     * Test AND specification returns true only when both specifications are satisfied.
     */
    public function test_and_specification_logic(): void
    {
        // Create mock specifications for testing logic
        $trueSpec = new class extends AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return true;
            }
        };

        $falseSpec = new class extends AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return false;
            }
        };

        // true AND true = true
        $andTrue = new AndSpecification($trueSpec, $trueSpec);
        $this->assertTrue($andTrue->isSatisfiedBy(null));

        // true AND false = false
        $andFalse = new AndSpecification($trueSpec, $falseSpec);
        $this->assertFalse($andFalse->isSatisfiedBy(null));

        // false AND false = false
        $andBothFalse = new AndSpecification($falseSpec, $falseSpec);
        $this->assertFalse($andBothFalse->isSatisfiedBy(null));
    }

    /**
     * Test OR specification returns true when either specification is satisfied.
     */
    public function test_or_specification_logic(): void
    {
        // Create mock specifications for testing logic
        $trueSpec = new class extends AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return true;
            }
        };

        $falseSpec = new class extends AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return false;
            }
        };

        // true OR true = true
        $orBothTrue = new OrSpecification($trueSpec, $trueSpec);
        $this->assertTrue($orBothTrue->isSatisfiedBy(null));

        // true OR false = true
        $orTrue = new OrSpecification($trueSpec, $falseSpec);
        $this->assertTrue($orTrue->isSatisfiedBy(null));

        // false OR false = false
        $orFalse = new OrSpecification($falseSpec, $falseSpec);
        $this->assertFalse($orFalse->isSatisfiedBy(null));
    }

    /**
     * Test NOT specification negates the wrapped specification.
     */
    public function test_not_specification_logic(): void
    {
        // Create mock specifications for testing logic
        $trueSpec = new class extends AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return true;
            }
        };

        $falseSpec = new class extends AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return false;
            }
        };

        // NOT true = false
        $notTrue = new NotSpecification($trueSpec);
        $this->assertFalse($notTrue->isSatisfiedBy(null));

        // NOT false = true
        $notFalse = new NotSpecification($falseSpec);
        $this->assertTrue($notFalse->isSatisfiedBy(null));
    }

    /**
     * Test complex composition with multiple specifications.
     */
    public function test_complex_composition(): void
    {
        // Create mock specifications
        $trueSpec = new class extends AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return true;
            }
        };

        $falseSpec = new class extends AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return false;
            }
        };

        // (true AND false) OR true = true
        $complex = $trueSpec->and($falseSpec)->or($trueSpec);
        $this->assertTrue($complex->isSatisfiedBy(null));

        // NOT (true OR false) = false
        $negated = $trueSpec->or($falseSpec)->not();
        $this->assertFalse($negated->isSatisfiedBy(null));

        // (NOT false) AND true = true
        $combined = $falseSpec->not()->and($trueSpec);
        $this->assertTrue($combined->isSatisfiedBy(null));
    }

    /**
     * Test double negation returns original specification.
     */
    public function test_double_negation(): void
    {
        $trueSpec = new class extends AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return true;
            }
        };

        // NOT (NOT true) = true
        $doubleNegated = $trueSpec->not()->not();
        $this->assertTrue($doubleNegated->isSatisfiedBy(null));
    }

    /**
     * Test De Morgan's Law: NOT (A AND B) = (NOT A) OR (NOT B)
     */
    public function test_de_morgan_and(): void
    {
        $trueSpec = new class extends AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return true;
            }
        };

        $falseSpec = new class extends AbstractSpecification {
            public function isSatisfiedBy(mixed $candidate): bool
            {
                return false;
            }
        };

        // NOT (true AND false) = true (because true AND false = false, NOT false = true)
        $leftSide = $trueSpec->and($falseSpec)->not();
        $this->assertTrue($leftSide->isSatisfiedBy(null));

        // (NOT true) OR (NOT false) = false OR true = true
        $rightSide = $trueSpec->not()->or($falseSpec->not());
        $this->assertTrue($rightSide->isSatisfiedBy(null));
    }
}
