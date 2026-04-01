<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Services;

use App\Domains\Reporting\Domain\Enums\Direction;

final class TrendCalculationService
{
    private const STABLE_THRESHOLD = 0.5;

    private const DECIMAL_PRECISION = 2;

    public function calculateChangePct(float|int $current, float|int|null $baseline): ?float
    {
        if ($baseline === null) {
            return null;
        }

        if (($baseline === 0 || $baseline === 0.0) && $current > 0) {
            return null;
        }

        if (($baseline === 0 || $baseline === 0.0) && ($current === 0 || $current === 0.0)) {
            return 0.0;
        }

        return round((($current - $baseline) / abs($baseline)) * 100, self::DECIMAL_PRECISION);
    }

    public function calculateDirection(float|int $current, float|int|null $baseline): Direction
    {
        if ($baseline === null) {
            return Direction::Stable;
        }

        if (($baseline === 0 || $baseline === 0.0) && $current > 0) {
            return Direction::Up;
        }

        if (($baseline === 0 || $baseline === 0.0) && ($current === 0 || $current === 0.0)) {
            return Direction::Stable;
        }

        $changePct = $this->calculateChangePct($current, $baseline);

        if ($changePct === null) {
            return Direction::Stable;
        }

        if (abs($changePct) <= self::STABLE_THRESHOLD) {
            return Direction::Stable;
        }

        return $changePct > 0 ? Direction::Up : Direction::Down;
    }

    /**
     * @return array{change_pct: float|null, direction: Direction}
     */
    public function calculate(float|int $current, float|int|null $baseline): array
    {
        return [
            'change_pct' => $this->calculateChangePct($current, $baseline),
            'direction' => $this->calculateDirection($current, $baseline),
        ];
    }
}
