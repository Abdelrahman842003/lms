<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Presentation\Resources\Admin;

use App\Domains\Reporting\Domain\DTO\AlertResult;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AdminReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'meta' => $this->resource['meta'],
            'applied_filters' => $this->resource['applied_filters'],
            'summary' => $this->resource['summary'],
            'sections' => [
                'revenue_trends' => $this->resource['sections']['revenue_trends'] ?? null,
                'subscription_health' => $this->resource['sections']['subscription_health'] ?? null,
                'plan_breakdown' => $this->resource['sections']['plan_breakdown'] ?? null,
                'entity_performance' => $this->resource['sections']['entity_performance'] ?? null,
            ],
            'alerts' => array_map(
                fn (AlertResult $alert): array => $alert->toArray(),
                $this->resource['alerts'] ?? []
            ),
            'drilldowns' => array_values($this->resource['drilldowns'] ?? []),
        ];
    }
}
