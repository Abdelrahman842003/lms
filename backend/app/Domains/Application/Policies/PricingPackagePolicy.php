<?php

declare(strict_types=1);

namespace App\Domains\Application\Policies;

class PricingPackagePolicy extends BasePolicy
{
    /**
     * Get the resource name for permission checking.
     */
    protected function getResourceName(): string
    {
        return 'pricing-packages';
    }

    /**
     * Determine if this resource should be accessible by academy role.
     */
    protected function isAcademyResource(): bool
    {
        return false; // Only admins should manage pricing packages
    }
}
