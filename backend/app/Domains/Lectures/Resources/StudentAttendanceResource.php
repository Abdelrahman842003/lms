<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class StudentAttendanceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status, // present, absent
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'lecture' => $this->whenLoaded('lecture', function () {
                return [
                    'id' => $this->lecture->id,
                    'title' => $this->lecture->title,
                    'start_time' => $this->lecture->start_time?->format('Y-m-d H:i:s'),
                ];
            }),
        ];
    }
}
