<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services;

use App\Domains\Reporting\Domain\Contracts\AlertRule;
use App\Domains\Reporting\Domain\DTO\AlertResult;
use App\Domains\Reporting\Domain\Services\AlertRules\AttendanceDropRule;
use App\Domains\Reporting\Domain\Services\AlertRules\HighInactivityRule;
use App\Domains\Reporting\Domain\Services\AlertRules\RenewalApproachingRule;
use App\Domains\Reporting\Domain\Services\AlertRules\RevenueDropRule;
use App\Domains\Reporting\Domain\Services\AlertRules\StrongGrowthRule;
use App\Domains\Reporting\Domain\Services\AlertRules\UsageNearLimitRule;

final class AlertEngine
{
    /**
     * @param  array<int, AlertRule>  $rules
     */
    public function __construct(
        private readonly array $rules = [],
    ) {}

    /**
     * @return array<int, AlertResult>
     */
    public function evaluate(array $context): array
    {
        $alerts = [];

        foreach ($this->rules as $rule) {
            $result = $rule->evaluate($context);
            if ($result !== null) {
                $alerts[] = $result;
            }
        }

        usort($alerts, fn (AlertResult $a, AlertResult $b): int => $a->severity->priority() <=> $b->severity->priority());

        return $alerts;
    }

    public function addRule(AlertRule $rule): self
    {
        return new self([...$this->rules, $rule]);
    }

    /**
     * @param  array<int, AlertRule>  $rules
     */
    public static function withDefaultRules(array $additionalRules = []): self
    {
        $defaultRules = [
            new AttendanceDropRule,
            new RevenueDropRule,
            new UsageNearLimitRule,
            new HighInactivityRule,
            new RenewalApproachingRule,
            new StrongGrowthRule,
        ];

        return new self([...$defaultRules, ...$additionalRules]);
    }
}
