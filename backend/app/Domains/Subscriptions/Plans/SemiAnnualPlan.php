<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Plans;

/**
 * Semi-annual subscription plan (6 months).
 * 
 * @see https://refactoring.guru/design-patterns/factory-method
 */
class SemiAnnualPlan extends AbstractPlan
{
    public function __construct()
    {
        $this->name = 'semi_annual';
        $this->label = 'نصف سنوي (6 شهور)';
        $this->months = 6;
    }
}
