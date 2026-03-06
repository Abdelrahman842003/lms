<?php

declare(strict_types=1);

namespace App\Domains\Videos\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VideoWatchProgressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'status' => $this->status?->value,
            'started_at' => $this->started_at,
            'last_watched_at' => $this->last_watched_at,
            'completed_at' => $this->completed_at,
            'watched_seconds' => (int) $this->watched_seconds,
            'watched_percentage' => (float) $this->watched_percentage,
            'last_position_seconds' => (int) $this->last_position_seconds,
        ];
    }
}
