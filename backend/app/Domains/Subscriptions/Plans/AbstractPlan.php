<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Plans;

/**
 * Abstract base class for subscription plans.
 * 
 * @see https://refactoring.guru/design-patterns/factory-method
 */
abstract class AbstractPlan implements PlanInterface
{
    protected string $name;
    protected string $label;
    protected int $months = 0;
    protected int $trialDays = 0;

    public function getName(): string
    {
        return $this->name;
    }

    public function getLabel(): string
    {
        return $this->label;
    }

    public function getMonths(): int
    {
        return $this->months;
    }

    public function getTrialDays(): int
    {
        return $this->trialDays;
    }

    public function isTrial(): bool
    {
        return false;
    }

    public function isCustom(): bool
    {
        return false;
    }

    public function calculateAmount(
        int $seats,
        float $pricePerSeat,
        int $storageGb,
        float $pricePerGb
    ): float {
        if ($this->months <= 0) {
            return 0.0;
        }

        $seatsAmount = $seats * $pricePerSeat * $this->months;
        $storageAmount = $storageGb * $pricePerGb * $this->months;

        return round($seatsAmount + $storageAmount, 2);
    }

    public function getEndDate(\Illuminate\Support\Carbon $startDate): ?\Illuminate\Support\Carbon
    {
        if ($this->months <= 0) {
            return null;
        }

        return $startDate->copy()->addMonths($this->months);
    }

    public function buildNotes(int $storageGb, float $storageAmount): string
    {
        $notes = "خطة: {$this->label}";
        
        if ($this->months > 0) {
            $notes .= " ({$this->months} شهر)";
        }

        if ($storageGb > 0 && $storageAmount > 0) {
            $notes .= " | مساحة: {$storageGb}GB = {$storageAmount}";
        }

        return $notes;
    }
}
