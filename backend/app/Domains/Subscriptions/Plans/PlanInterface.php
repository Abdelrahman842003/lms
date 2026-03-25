<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Plans;

/**
 * Interface for subscription plan implementations.
 * 
 * @see https://refactoring.guru/design-patterns/factory-method
 */
interface PlanInterface
{
    /**
     * Get the plan identifier.
     */
    public function getName(): string;

    /**
     * Get the plan label for display.
     */
    public function getLabel(): string;

    /**
     * Get the duration in months (0 for trial/custom).
     */
    public function getMonths(): int;

    /**
     * Get trial days (if applicable).
     */
    public function getTrialDays(): int;

    /**
     * Check if this is a trial plan.
     */
    public function isTrial(): bool;

    /**
     * Check if this is a custom plan.
     */
    public function isCustom(): bool;

    /**
     * Calculate the subscription amount.
     *
     * @param int $seats Number of seats
     * @param float $pricePerSeat Price per seat per month
     * @param int $storageGb Storage limit in GB
     * @param float $pricePerGb Price per GB per month
     * @return float Total amount
     */
    public function calculateAmount(
        int $seats,
        float $pricePerSeat,
        int $storageGb,
        float $pricePerGb
    ): float;

    /**
     * Get the end date for a subscription starting at the given date.
     */
    public function getEndDate(\Illuminate\Support\Carbon $startDate): ?\Illuminate\Support\Carbon;

    /**
     * Build notes for the subscription.
     */
    public function buildNotes(int $storageGb, float $storageAmount): string;
}
