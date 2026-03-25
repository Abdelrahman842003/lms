<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Specifications;

use App\Domains\Subscriptions\DTOs\SubscriptionCandidate;

/**
 * Specification Interface
 *
 * Implements the Specification Pattern for encapsulating business rules.
 * This pattern allows for composable, reusable business logic that can be
 * combined using boolean operators (AND, OR, NOT).
 *
 * @see https://designpatternsphp.readthedocs.io/en/latest/Behavioral/Specification/ Specification Pattern
 * @see https://martinfowler.com/apsupp/spec.pdf Specification Pattern by Martin Fowler
 */
interface SpecificationInterface
{
    /**
     * Check if the candidate satisfies the specification
     *
     * @param SubscriptionCandidate|array|int $candidate The candidate to evaluate.
     *         Can be a SubscriptionCandidate DTO, an array with subscriberId/subscriberType,
     *         or an integer (treated as teacher ID for backward compatibility).
     * @param int $depth Internal parameter for tracking composition depth to prevent stack overflow.
     *         Should not be passed by external callers.
     * @return bool True if the candidate satisfies the specification
     */
    public function isSatisfiedBy(mixed $candidate, int $depth = 0): bool;

    /**
     * Combine with another specification using AND logic
     */
    public function and(SpecificationInterface $other): SpecificationInterface;

    /**
     * Combine with another specification using OR logic
     */
    public function or(SpecificationInterface $other): SpecificationInterface;

    /**
     * Negate this specification using NOT logic
     */
    public function not(): SpecificationInterface;
}
