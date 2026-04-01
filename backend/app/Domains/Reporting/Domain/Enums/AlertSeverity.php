<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\Enums;

enum AlertSeverity: string
{
    case Info = 'info';
    case Warning = 'warning';
    case Critical = 'critical';

    public function label(): string
    {
        return match ($this) {
            self::Info => 'Info',
            self::Warning => 'Warning',
            self::Critical => 'Critical',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Info => 'blue',
            self::Warning => 'yellow',
            self::Critical => 'red',
        };
    }

    public function priority(): int
    {
        return match ($this) {
            self::Critical => 1,
            self::Warning => 2,
            self::Info => 3,
        };
    }
}
