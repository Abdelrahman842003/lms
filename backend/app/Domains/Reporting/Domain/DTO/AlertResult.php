<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Domain\DTO;

use App\Domains\Reporting\Domain\Enums\AlertSeverity;

final readonly class AlertResult
{
    public function __construct(
        public string $alertKey,
        public AlertSeverity $severity,
        public string $message,
        public array $context = [],
        public ?string $sourceSection = null,
        public ?string $drilldownKey = null,
    ) {}

    public function toArray(): array
    {
        return [
            'alert_key' => $this->alertKey,
            'severity' => $this->severity->value,
            'message' => $this->message,
            'context' => $this->context,
            'source_section' => $this->sourceSection,
            'drilldown_key' => $this->drilldownKey,
        ];
    }
}
