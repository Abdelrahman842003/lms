<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class TeacherReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'meta' => $this->resource['meta'],
            'applied_filters' => $this->resource['applied_filters'],
            'summary' => $this->resource['summary'],
            'sections' => $this->resource['sections'],
            'alerts' => $this->resource['alerts'],
        ];
    }
}
