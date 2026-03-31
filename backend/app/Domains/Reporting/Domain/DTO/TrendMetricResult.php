<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\DTO;

use App\Domains\Reporting\Domain\Enums\Direction;

final readonly class TrendMetricResult
{
    /**
     * @param  array<int, array{label: string, value: float|int}>  $series
     */
    public function __construct(
        public array $series,
        public float|int $current,
        public float|int|null $baseline = null,
        public ?float $changePct = null,
        public Direction $direction = Direction::Stable,
    ) {}

    public function toArray(): array
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
