<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Filters;

use App\Domains\Reporting\Domain\Enums\ComparisonMode;
use App\Domains\Reporting\Domain\Enums\ReportingPeriodPreset;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use DateTimeZone;
use InvalidArgumentException;

final readonly class ReportFilterNormalizer
{
    public function normalize(array $input, DateTimeZone|string $timezone = 'UTC'): ReportFilters
    {
        $tz = is_string($timezone) ? new DateTimeZone($timezone) : $timezone;

        $preset = $this->resolvePreset($input);
        $comparisonMode = $this->resolveComparisonMode($input);

        $this->validateFilters($input, $preset);

        return ReportFilters::fromArray([
            'preset' => $preset->value,
            'start_at' => $input['start_at'] ?? null,
            'end_at' => $input['end_at'] ?? null,
            'comparison_mode' => $comparisonMode?->value,
            'entity_type' => $input['entity_type'] ?? null,
            'plan_id' => $input['plan_id'] ?? null,
            'subscription_status' => $input['subscription_status'] ?? null,
            'growth_direction' => $input['growth_direction'] ?? null,
            'usage_threshold' => $input['usage_threshold'] ?? null,
        ], $tz);
    }

    private function resolvePreset(array $input): ReportingPeriodPreset
    {
        if (! isset($input['preset'])) {
            return ReportingPeriodPreset::ThisMonth;
        }

        return ReportingPeriodPreset::from($input['preset']);
    }

    private function resolveComparisonMode(array $input): ?ComparisonMode
    {
        if (! isset($input['comparison_mode'])) {
            return null;
        }

        if ($input['comparison_mode'] === '' || $input['comparison_mode'] === 'none') {
            return null;
        }

        return ComparisonMode::from($input['comparison_mode']);
    }

    private function validateFilters(array $input, ReportingPeriodPreset $preset): void
    {
        if ($preset === ReportingPeriodPreset::CustomRange) {
            if (empty($input['start_at']) || empty($input['end_at'])) {
                throw new InvalidArgumentException('Custom range requires both start_at and end_at');
            }
        }

        if (isset($input['usage_threshold']) && ($input['usage_threshold'] < 0 || $input['usage_threshold'] > 100)) {
            throw new InvalidArgumentException('usage_threshold must be between 0 and 100');
        }

        if (isset($input['growth_direction']) && ! in_array($input['growth_direction'], ['up', 'down', 'stable'], true)) {
            throw new InvalidArgumentException('growth_direction must be up, down, or stable');
        }
    }
}
