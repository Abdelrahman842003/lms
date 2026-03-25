<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Specifications;

use App\Domains\Subscriptions\Exceptions\SpecificationDepthExceededException;

/**
 * Not Specification (Composite Specification)
 *
 * A composite specification that negates another specification.
 * Returns true only if the wrapped specification is NOT satisfied.
 *
 * This class is used internally by AbstractSpecification::not() method and should
 * not be instantiated directly. Use the fluent interface instead:
 *
 * @example
 * ```php
 * // Instead of:
 * $notSpec = new NotSpecification($specification);
 *
 * // Use the fluent interface:
 * $negatedSpec = $specification->not();
 *
 * // Common use case: exclude certain conditions
 * $canDelete = $isOwner->and($isNotArchived->not());
 * // Or more readably:
 * $cannotEnroll = $planExpired->or($noSeatsAvailable);
 * $canEnroll = $cannotEnroll->not();
 *
 * if ($canEnroll->isSatisfiedBy($subscription)) {
 * // The subscription can enroll new students
 * }
 * ```
 *
 * @see AbstractSpecification::not() The method that creates instances of this class
 * @see SpecificationInterface The interface this class implements
 * @see https://designpatternsphp.readthedocs.io/en/latest/Behavioral/Specification/ Specification Pattern
 */
class NotSpecification implements SpecificationInterface
{
    /**
     * Maximum depth to prevent stack overflow from deeply nested compositions.
     */
    private const MAX_DEPTH = 20;

    private SpecificationInterface $specification;

    /**
     * Create a new NOT composite specification.
     *
     * @param SpecificationInterface $specification The specification to negate
     */
    public function __construct(SpecificationInterface $specification)
    {
        $this->specification = $specification;
    }

    /**
     * Check if the candidate does NOT satisfy the wrapped specification.
     *
     * @param mixed $candidate The candidate to evaluate
     * @param int $depth Internal parameter for tracking composition depth
     * @return bool True if the wrapped specification is NOT satisfied
     * @throws SpecificationDepthExceededException If maximum depth is exceeded
     */
    public function isSatisfiedBy(mixed $candidate, int $depth = 0): bool
    {
        if ($depth > self::MAX_DEPTH) {
            throw new SpecificationDepthExceededException(self::MAX_DEPTH);
        }

        return !$this->specification->isSatisfiedBy($candidate, $depth + 1);
    }

    /**
     * Combine this NOT specification with another using AND logic.
     *
     * @param SpecificationInterface $other The specification to combine with
     * @return SpecificationInterface A new AndSpecification containing this and the other
     */
    public function and(SpecificationInterface $other): SpecificationInterface
    {
        return new AndSpecification($this, $other);
    }

    /**
     * Combine this NOT specification with another using OR logic.
     *
     * @param SpecificationInterface $other The specification to combine with
     * @return SpecificationInterface A new OrSpecification containing this and the other
     */
    public function or(SpecificationInterface $other): SpecificationInterface
    {
        return new OrSpecification($this, $other);
    }

    /**
     * Double negation - returns the original specification.
     *
     * Double negation cancels out: NOT (NOT A) = A
     *
     * @return SpecificationInterface The original wrapped specification
     */
    public function not(): SpecificationInterface
    {
        return $this->specification;
    }
}
