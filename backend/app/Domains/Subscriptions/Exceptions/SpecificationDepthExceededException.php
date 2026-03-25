<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Exceptions;

use RuntimeException;

/**
 * Exception thrown when specification composition depth exceeds the maximum allowed.
 * 
 * This exception is thrown to prevent stack overflow errors from deeply nested
 * specification compositions. If you encounter this exception, consider
 * simplifying your specification composition.
 * 
 * @see \App\Domains\Subscriptions\Specifications\AndSpecification
 * @see \App\Domains\Subscriptions\Specifications\OrSpecification
 * @see \App\Domains\Subscriptions\Specifications\NotSpecification
 */
class SpecificationDepthExceededException extends RuntimeException
{
    /**
     * @param int $maxDepth The maximum depth that was exceeded
     */
    public function __construct(int $maxDepth)
    {
        parent::__construct(
            "Specification composition depth exceeded maximum of {$maxDepth}. " .
            "Consider simplifying your specification composition."
        );
    }
}
