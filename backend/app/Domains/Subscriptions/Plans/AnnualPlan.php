<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Plans;

/**
 * Annual subscription plan (12 months).
 * 
 * @see https://refactoring.guru/design-patterns/factory-method
 */
class AnnualPlan extends AbstractPlan
{
    public function __construct()
    {
        $this->name = 'annual';
        $this->label = 'سنوي (1 سنة)';
        $this->months = 12;
    }
}
