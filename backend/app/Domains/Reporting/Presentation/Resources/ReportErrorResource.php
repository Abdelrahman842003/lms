<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class ReportErrorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'error' => [
                'code' => $this->resource['code'] ?? 'REPORT_ERROR',
                'message' => $this->resource['message'] ?? 'An error occurred while generating the report',
                'details' => $this->resource['details'] ?? null,
            ],
        ];
    }
}
