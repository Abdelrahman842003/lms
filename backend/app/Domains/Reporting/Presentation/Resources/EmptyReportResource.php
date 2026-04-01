<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class EmptyReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'summary' => [],
            'trends' => [],
            'breakdown' => [
                'data' => [],
                'schema' => [],
                'pagination' => [
                    'page' => 1,
                    'per_page' => 15,
                    'total' => 0,
                    'last_page' => 1,
                ],
                'sort' => [],
            ],
            'alerts' => [],
            'applied_filters' => $this->resource,
        ];
    }
}
