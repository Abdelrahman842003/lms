<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Presentation\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AdminDrilldownResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->resource['data'],
            'schema' => $this->resource['schema'],
            'pagination' => $this->resource['pagination'],
            'sort' => $this->resource['sort'],
        ];
    }
}
