<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Specifications;

use App\Domains\Subscriptions\Exceptions\SpecificationDepthExceededException;

/**
 * And Specification (Composite Specification)
 *
 * A composite specification that combines two specifications using AND logic.
 * Returns true only if BOTH wrapped specifications are satisfied.
 *
 * This class is used internally by AbstractSpecification::and() method and should
 * not be instantiated directly. Use the fluent interface instead:
 *
 * @example
 * ```php
 * // Instead of:
 * $andSpec = new AndSpecification($spec1, $spec2);
 *
 * // Use the fluent interface:
 * $combinedSpec = $spec1->and($spec2);
 *
 * // Chain multiple specifications:
 * $complexSpec = $planActive->and($seatAvailable)->and($notExpired);
 *
 * if ($complexSpec->isSatisfiedBy($subscription)) {
 * // All conditions are met
 * }
 * ```
 *
 * @see AbstractSpecification::and() The method that creates instances of this class
 * @see SpecificationInterface The interface this class implements
 * @see https://designpatternsphp.readthedocs.io/en/latest/Behavioral/Specification/ Specification Pattern
 */
class AndSpecification implements SpecificationInterface
{
    /**
     * Maximum depth to prevent stack overflow from deeply nested compositions.
     */
    private const MAX_DEPTH = 20;

    private SpecificationInterface $left;
    private SpecificationInterface $right;

    /**
     * Create a new AND composite specification.
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
     * Check if the candidate satisfies BOTH specifications.
     *
     * @param mixed $candidate The candidate to evaluate
     * @param int $depth Internal parameter for tracking composition depth
     * @return bool True only if both left AND right specifications are satisfied
     * @throws SpecificationDepthExceededException If maximum depth is exceeded
     */
    public function isSatisfiedBy(mixed $candidate, int $depth = 0): bool
    {
        if ($depth > self::MAX_DEPTH) {
            throw new SpecificationDepthExceededException(self::MAX_DEPTH);
        }

        return $this->left->isSatisfiedBy($candidate, $depth + 1)
            && $this->right->isSatisfiedBy($candidate, $depth + 1);
    }

    /**
     * Combine this AND specification with another using AND logic.
     *
     * @param SpecificationInterface $other The specification to combine with
     * @return SpecificationInterface A new AndSpecification containing this and the other
     */
    public function and(SpecificationInterface $other): SpecificationInterface
    {
        return new AndSpecification($this, $other);
    }

    /**
     * Combine this AND specification with another using OR logic.
     *
     * @param SpecificationInterface $other The specification to combine with
     * @return SpecificationInterface A new OrSpecification containing this and the other
     */
    public function or(SpecificationInterface $other): SpecificationInterface
    {
        return new OrSpecification($this, $other);
    }

    /**
     * Negate this AND specification.
     *
     * Uses De Morgan's Law: NOT (A AND B) = (NOT A) OR (NOT B)
     *
     * @return SpecificationInterface A specification that is satisfied when this is NOT satisfied
     */
    public function not(): SpecificationInterface
    {
        return new OrSpecification($this->left->not(), $this->right->not());
    }
}
