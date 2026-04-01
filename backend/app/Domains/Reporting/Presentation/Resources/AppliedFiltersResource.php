<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Presentation\Resources;

use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ReportFilters
 */
final class AppliedFiltersResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'preset' => $this->period->preset?->value,
            'start_at' => $this->period->startAt->toIso8601String(),
            'end_at' => $this->period->endAt->toIso8601String(),
            'timezone' => $this->period->timezone->getName(),
            'comparison_mode' => $this->comparisonMode?->value,
            'comparison_period' => $this->comparisonPeriod ? [
                'start_at' => $this->comparisonPeriod->startAt->toIso8601String(),
                'end_at' => $this->comparisonPeriod->endAt->toIso8601String(),
            ] : null,
            'entity_type' => $this->entityType,
            'plan_id' => $this->planId,
            'subscription_status' => $this->subscriptionStatus,
            'growth_direction' => $this->growthDirection,
            'usage_threshold' => $this->usageThreshold,
        ];
    }
}
