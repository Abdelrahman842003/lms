<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Presentation\Resources;

use App\Domains\Reporting\Domain\DTO\AlertResult;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AlertResult
 */
final class AlertResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'alert_key' => $this->alertKey,
            'severity' => $this->severity->value,
            'message' => $this->message,
            'context' => $this->context,
            'source_section' => $this->sourceSection,
        ];
    }
}
