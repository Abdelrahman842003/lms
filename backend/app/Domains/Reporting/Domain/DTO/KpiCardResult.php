<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\DTO;

use App\Domains\Reporting\Domain\Enums\Direction;

final readonly class KpiCardResult
{
    public function __construct(
        public string $key,
        public string $title,
        public float|int $currentValue,
        public float|int|null $baselineValue = null,
        public ?float $changePct = null,
        public Direction $direction = Direction::Stable,
        public ?string $statusColor = null,
        public ?string $note = null,
        public ?string $drilldownKey = null,
    ) {}

    public function toArray(): array
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
