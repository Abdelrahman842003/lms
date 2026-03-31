<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\ValueObjects;

use App\Domains\Reporting\Domain\Enums\ComparisonMode;
use App\Domains\Reporting\Domain\Enums\ReportingPeriodPreset;
use DateTimeZone;
use InvalidArgumentException;

final readonly class ReportFilters
{
    public function __construct(
        public ReportingPeriod $period,
        public ?ComparisonPeriod $comparisonPeriod = null,
        public ?ComparisonMode $comparisonMode = null,
        public ?string $entityType = null,
        public ?int $planId = null,
        public ?string $subscriptionStatus = null,
        public ?string $growthDirection = null,
        public ?float $usageThreshold = null,
    ) {}

    public static function fromArray(array $params, DateTimeZone|string $timezone = 'UTC'): self
    {
        $tz = is_string($timezone) ? new DateTimeZone($timezone) : $timezone;
        $preset = isset($params['preset'])
            ? ReportingPeriodPreset::from($params['preset'])
            : ReportingPeriodPreset::ThisMonth;

        if ($preset === ReportingPeriodPreset::CustomRange) {
            if (! isset($params['start_at'], $params['end_at'])) {
                throw new InvalidArgumentException('Custom range requires start_at and end_at');
            }
            $period = ReportingPeriod::fromCustomRange(
                startAt: carbon($params['start_at'])->setTimezone($tz),
                endAt: carbon($params['end_at'])->setTimezone($tz),
                timezone: $tz,
            );
        } else {
            $period = ReportingPeriod::fromPreset($preset, $tz);
        }

        $comparisonMode = isset($params['comparison_mode'])
            ? ComparisonMode::from($params['comparison_mode'])
            : null;

        $comparisonPeriod = null;
        if ($comparisonMode !== null) {
            $comparisonPeriod = ComparisonPeriod::fromReportingPeriod($period, $comparisonMode);
        }

        return new self(
            period: $period,
            comparisonPeriod: $comparisonPeriod,
            comparisonMode: $comparisonMode,
            entityType: $params['entity_type'] ?? null,
            planId: isset($params['plan_id']) ? (int) $params['plan_id'] : null,
            subscriptionStatus: $params['subscription_status'] ?? null,
            growthDirection: $params['growth_direction'] ?? null,
            usageThreshold: isset($params['usage_threshold']) ? (float) $params['usage_threshold'] : null,
        );
    }

    public function hasComparison(): bool
    {
        return $this->comparisonPeriod !== null;
    }

    public function toArray(): array
    {
        return array_filter([
            'preset' => $this->period->preset?->value,
            'start_at' => $this->period->startAt->toIso8601String(),
            'end_at' => $this->period->endAt->toIso8601String(),
            'timezone' => $this->period->timezone->getName(),
            'comparison_mode' => $this->comparisonMode?->value,
            'entity_type' => $this->entityType,
            'plan_id' => $this->planId,
            'subscription_status' => $this->subscriptionStatus,
            'growth_direction' => $this->growthDirection,
            'usage_threshold' => $this->usageThreshold,
        ], fn (mixed $value): bool => $value !== null);
    }
}
