<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Presentation\Resources;

use App\Domains\Reporting\Domain\DTO\KpiCardResult;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin KpiCardResult
 */
final class KpiCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'key' => $this->key,
            'title' => $this->title,
            'current_value' => $this->currentValue,
            'baseline_value' => $this->baselineValue,
            'change_pct' => $this->changePct,
            'direction' => $this->direction->value,
            'status_color' => $this->statusColor,
            'note' => $this->note,
            'drilldown_key' => $this->drilldownKey,
        ];
    }
}
