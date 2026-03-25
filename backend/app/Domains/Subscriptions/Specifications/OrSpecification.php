<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Specifications;

use App\Domains\Subscriptions\Exceptions\SpecificationDepthExceededException;

/**
 * Or Specification (Composite Specification)
 *
 * A composite specification that combines two specifications using OR logic.
 * Returns true if EITHER of the wrapped specifications is satisfied.
 *
 * This class is used internally by AbstractSpecification::or() method and should
 * not be instantiated directly. Use the fluent interface instead:
 *
 * @example
 * ```php
 * // Instead of:
 * $orSpec = new OrSpecification($spec1, $spec2);
 *
 * // Use the fluent interface:
 * $combinedSpec = $spec1->or($spec2);
 *
 * // Chain multiple specifications for flexible conditions:
 * $canEnroll = $hasActivePlan->or($isInGracePeriod)->or($isAdmin);
 *
 * if ($canEnroll->isSatisfiedBy($user)) {
 * // At least one condition is met
 * }
 * ```
 *
 * @see AbstractSpecification::or() The method that creates instances of this class
 * @see SpecificationInterface The interface this class implements
 * @see https://designpatternsphp.readthedocs.io/en/latest/Behavioral/Specification/ Specification Pattern
 */
class OrSpecification implements SpecificationInterface
{
    /**
     * Maximum depth to prevent stack overflow from deeply nested compositions.
     */
    private const MAX_DEPTH = 20;

    private SpecificationInterface $left;
    private SpecificationInterface $right;

    /**
     * Create a new OR composite specification.
     *
     * @param SpecificationInterface $left The first specification to check
     * @param SpecificationInterface $right The second specification to check
     */
    public function __construct(SpecificationInterface $left, SpecificationInterface $right)
    {
        $this->left = $left;
        $this->right = $right;
    }

    /**
     * Check if the candidate satisfies EITHER specification.
     *
     * @param mixed $candidate The candidate to evaluate
     * @param int $depth Internal parameter for tracking composition depth
     * @return bool True if either left OR right specification is satisfied
     * @throws SpecificationDepthExceededException If maximum depth is exceeded
     */
    public function isSatisfiedBy(mixed $candidate, int $depth = 0): bool
    {
        if ($depth > self::MAX_DEPTH) {
            throw new SpecificationDepthExceededException(self::MAX_DEPTH);
        }

        return $this->left->isSatisfiedBy($candidate, $depth + 1)
            || $this->right->isSatisfiedBy($candidate, $depth + 1);
    }

    /**
     * Combine this OR specification with another using AND logic.
     *
     * @param SpecificationInterface $other The specification to combine with
     * @return SpecificationInterface A new AndSpecification containing this and the other
     */
    public function and(SpecificationInterface $other): SpecificationInterface
    {
        return new AndSpecification($this, $other);
    }

    /**
     * Combine this OR specification with another using OR logic.
     *
     * @param SpecificationInterface $other The specification to combine with
     * @return SpecificationInterface A new OrSpecification containing this and the other
     */
    public function or(SpecificationInterface $other): SpecificationInterface
    {
        return new OrSpecification($this, $other);
    }

    /**
     * Negate this OR specification.
     *
     * Uses De Morgan's Law: NOT (A OR B) = (NOT A) AND (NOT B)
     *
     * @return SpecificationInterface A specification that is satisfied when this is NOT satisfied
     */
    public function not(): SpecificationInterface
    {
        return new AndSpecification($this->left->not(), $this->right->not());
    }
}
