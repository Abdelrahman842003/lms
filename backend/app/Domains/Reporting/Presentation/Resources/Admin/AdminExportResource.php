<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Presentation\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AdminExportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'summary_kpis' => $this->resource['summary_kpis'],
            'breakdown_data' => $this->resource['breakdown_data'],
            'detailed_rows' => $this->resource['detailed_rows'],
            'applied_filter_metadata' => $this->resource['applied_filter_metadata'],
        ];
    }
}
