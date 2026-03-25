<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Plans;

/**
 * Custom subscription plan with configurable duration.
 * 
 * @see https://refactoring.guru/design-patterns/factory-method
 */
class CustomPlan extends AbstractPlan
{
    public function __construct(int $customMonths = 1)
    {
        $this->name = 'custom';
        $this->label = "مخصص ({$customMonths} شهر)";
        $this->months = $customMonths;
    }

    public function isCustom(): bool
    {
        return true;
    }

    public function buildNotes(int $storageGb, float $storageAmount): string
    {
        $notes = "خطة مخصصة: {$this->months} شهر";

        if ($storageGb > 0 && $storageAmount > 0) {
            $notes .= " | مساحة: {$storageGb}GB = {$storageAmount}";
        }

        return $notes;
    }
}
