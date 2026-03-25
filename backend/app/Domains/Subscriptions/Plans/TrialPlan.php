<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Plans;

/**
 * Trial subscription plan.
 * 
 * @see https://refactoring.guru/design-patterns/factory-method
 */
class TrialPlan extends AbstractPlan
{
    public function __construct(int $trialDays = 14)
    {
        $this->name = 'trial';
        $this->label = "تجريبي ({$trialDays} يوم)";
        $this->months = 0;
        $this->trialDays = $trialDays;
    }

    public function isTrial(): bool
    {
        return true;
    }

    public function calculateAmount(
        int $seats,
        float $pricePerSeat,
        int $storageGb,
        float $pricePerGb
    ): float {
        return 0.0; // Trial is free
    }

    public function getEndDate(\Illuminate\Support\Carbon $startDate): ?\Illuminate\Support\Carbon
    {
        return $startDate->copy()->addDays($this->trialDays);
    }

    public function buildNotes(int $storageGb, float $storageAmount): string
    {
        return "فترة تجريبية: {$this->trialDays} يوم";
    }
}
