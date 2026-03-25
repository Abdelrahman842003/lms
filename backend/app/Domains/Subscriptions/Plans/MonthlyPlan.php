<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Plans;

/**
 * Monthly subscription plan.
 * 
 * @see https://refactoring.guru/design-patterns/factory-method
 */
class MonthlyPlan extends AbstractPlan
{
    public function __construct()
    {
        $this->name = 'monthly';
        $this->label = 'شهري (1 شهر)';
        $this->months = 1;
    }
}
