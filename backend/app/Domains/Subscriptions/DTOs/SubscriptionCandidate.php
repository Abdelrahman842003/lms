<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\DTOs;

use InvalidArgumentException;

/**
 * Data Transfer Object for subscription specification candidates.
 * 
 * Used to pass subscriber information to specification pattern implementations
 * in a type-safe manner.
 * 
 * @see \App\Domains\Subscriptions\Specifications\SpecificationInterface
 */
readonly class SubscriptionCandidate
{
    /**
     * @param int $subscriberId The ID of the subscriber (teacher or academy)
     * @param string $subscriberType The type of subscriber ('teacher' or 'academy')
     * @throws InvalidArgumentException If subscriber type is invalid
     */
    public function __construct(
        public readonly int $subscriberId,
        public readonly string $subscriberType = 'teacher'
    ) {
        if (!in_array($subscriberType, ['teacher', 'academy'], true)) {
            throw new InvalidArgumentException(
                "Subscriber type must be 'teacher' or 'academy', got: {$subscriberType}"
            );
        }
    }

    /**
     * Create from array (useful for backward compatibility)
     * 
     * @param array $data Array with subscriberId/subscriber_id and optionally subscriberType/subscriber_type
     * @return self
     */
    public static function fromArray(array $data): self
    {
        return new self(
            subscriberId: $data['subscriberId'] ?? $data['subscriber_id'],
            subscriberType: $data['subscriberType'] ?? $data['subscriber_type'] ?? 'teacher'
        );
    }

    /**
     * Create from object (useful for backward compatibility)
     * 
     * @param object $object Object with subscriberId/subscriber_id and optionally subscriberType/subscriber_type
     * @return self
     */
    public static function fromObject(object $object): self
    {
        return new self(
            subscriberId: $object->subscriberId ?? $object->subscriber_id,
            subscriberType: $object->subscriberType ?? $object->subscriber_type ?? 'teacher'
        );
    }

    /**
     * Create from mixed (for backward compatibility during transition)
     * 
     * Accepts:
     * - SubscriptionCandidate instances (returned as-is)
     * - Arrays with subscriberId/subscriber_id keys
     * - Objects with subscriberId/subscriber_id properties
     * - Integers (treated as teacher ID)
     * 
     * @param mixed $candidate The candidate data
     * @return self
     * @throws InvalidArgumentException If candidate cannot be converted
     */
    public static function from(mixed $candidate): self
    {
        if ($candidate instanceof self) {
            return $candidate;
        }

        if (is_array($candidate)) {
            return self::fromArray($candidate);
        }

        if (is_object($candidate)) {
            return self::fromObject($candidate);
        }

        // Legacy: assume it's just an ID (teacher)
        if (is_int($candidate)) {
            return new self($candidate, 'teacher');
        }

        throw new InvalidArgumentException(
            'Cannot create SubscriptionCandidate from ' . gettype($candidate)
        );
    }
}
