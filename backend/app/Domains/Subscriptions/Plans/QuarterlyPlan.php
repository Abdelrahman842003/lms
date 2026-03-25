<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Plans;

/**
 * Quarterly subscription plan (3 months).
 * 
 * @see https://refactoring.guru/design-patterns/factory-method
 */
class QuarterlyPlan extends AbstractPlan
{
    public function __construct()
    {
        $this->name = 'quarterly';
        $this->label = 'ربع سنوي (3 شهور)';
        $this->months = 3;
    }
}
