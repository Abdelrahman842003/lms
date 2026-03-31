<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Presentation\Resources;

use App\Domains\Reporting\Domain\DTO\TrendMetricResult;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin TrendMetricResult
 */
final class TrendMetricResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'series' => $this->series,
            'summary' => [
                'current' => $this->current,
                'baseline' => $this->baseline,
                'change_pct' => $this->changePct,
                'direction' => $this->direction->value,
            ],
        ];
    }
}
