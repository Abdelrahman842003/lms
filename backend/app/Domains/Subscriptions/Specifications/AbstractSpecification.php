<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Specifications;

/**
 * Abstract Specification
 *
 * Base class for all specifications providing composite operations.
 * Implements the Composite Pattern for combining specifications.
 *
 * @see https://designpatternsphp.readthedocs.io/en/latest/Behavioral/Specification/ Specification Pattern
 */
abstract class AbstractSpecification implements SpecificationInterface
{
    /**
     * Check if the candidate satisfies the specification.
     *
     * Leaf specifications should override this method with their specific logic.
     *
     * @param mixed $candidate The candidate to evaluate
     * @param int $depth Internal parameter for tracking composition depth (ignored in leaf specs)
     * @return bool True if the candidate satisfies the specification
     */
    public function isSatisfiedBy(mixed $candidate, int $depth = 0): bool
    {
        // Base implementation - leaf specifications should override this
        return false;
    }

    /**
     * Combine with another specification using AND logic
     */
    public function and(SpecificationInterface $other): SpecificationInterface
    {
        return new AndSpecification($this, $other);
    }

    /**
     * Combine with another specification using OR logic
     */
    public function or(SpecificationInterface $other): SpecificationInterface
    {
        return new OrSpecification($this, $other);
    }

    /**
     * Negate this specification using NOT logic
     */
    public function not(): SpecificationInterface
    {
        return new NotSpecification($this);
    }
}
