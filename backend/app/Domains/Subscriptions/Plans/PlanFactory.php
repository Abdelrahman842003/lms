<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Plans;

use App\Domains\Application\Services\HelperService;
use InvalidArgumentException;

/**
 * Factory for creating subscription plan instances.
 * 
 * @see https://refactoring.guru/design-patterns/factory-method
 */
class PlanFactory
{
    private static array $plans = [
        'trial' => TrialPlan::class,
        'monthly' => MonthlyPlan::class,
        'quarterly' => QuarterlyPlan::class,
        'semi_annual' => SemiAnnualPlan::class,
        'annual' => AnnualPlan::class,
        'custom' => CustomPlan::class,
    ];

    /**
     * Create a plan instance from a plan name.
     */
    public static function create(string $planName, ?int $customMonths = null): PlanInterface
    {
        if (!isset(self::$plans[$planName])) {
            throw new InvalidArgumentException("Unknown subscription plan: {$planName}");
        }

        $class = self::$plans[$planName];

        // Handle special cases
        return match ($planName) {
            'trial' => new $class(HelperService::getTrialPeriodDays()),
            'custom' => new $class($customMonths ?? 1),
            default => new $class(),
        };
    }

    /**
     * Create a trial plan with default trial days.
     */
    public static function createTrial(): TrialPlan
    {
        return new TrialPlan(HelperService::getTrialPeriodDays());
    }

    /**
     * Create a monthly plan.
     */
    public static function createMonthly(): MonthlyPlan
    {
        return new MonthlyPlan();
    }

    /**
     * Create a quarterly plan.
     */
    public static function createQuarterly(): QuarterlyPlan
    {
        return new QuarterlyPlan();
    }

    /**
     * Create a semi-annual plan.
     */
    public static function createSemiAnnual(): SemiAnnualPlan
    {
        return new SemiAnnualPlan();
    }

    /**
     * Create an annual plan.
     */
    public static function createAnnual(): AnnualPlan
    {
        return new AnnualPlan();
    }

    /**
     * Create a custom plan with specified months.
     */
    public static function createCustom(int $months): CustomPlan
    {
        return new CustomPlan($months);
    }

    /**
     * Get all available plan names.
     *
     * @return array<string>
     */
    public static function getAvailablePlans(): array
    {
        return array_keys(self::$plans);
    }

    /**
     * Get all plan instances.
     *
     * @return array<PlanInterface>
     */
    public static function getAllPlans(): array
    {
        $plans = [];
        foreach (self::$plans as $name => $class) {
            $plans[$name] = self::create($name);
        }
        return $plans;
    }

    /**
     * Get plan options for form selects.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function getPlanOptions(): array
    {
        $options = [];
        foreach (self::$plans as $name => $class) {
            $plan = self::create($name);
            $options[] = [
                'value' => $name,
                'label' => $plan->getLabel(),
                'months' => $plan->getMonths(),
                'trial_days' => $plan->getTrialDays(),
            ];
        }
        return $options;
    }

    /**
     * Check if a plan name is valid.
     */
    public static function isValidPlan(string $planName): bool
    {
        return isset(self::$plans[$planName]);
    }

    /**
     * Register a custom plan type.
     */
    public static function registerPlan(string $name, string $class): void
    {
        if (!is_subclass_of($class, PlanInterface::class)) {
            throw new InvalidArgumentException(
                "Class {$class} must implement PlanInterface"
            );
        }

        self::$plans[$name] = $class;
    }
}
