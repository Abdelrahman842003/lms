<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Enums;

enum Direction: string
{
    case Up = 'up';
    case Down = 'down';
    case Stable = 'stable';

    public function label(): string
    {
        return match ($this) {
            self::Up => 'Up',
            self::Down => 'Down',
            self::Stable => 'Stable',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Up => 'green',
            self::Down => 'red',
            self::Stable => 'gray',
        };
    }
}
