<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Resources\Academy;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'target_type' => $this->target_type,
            'target_ids' => $this->target_ids ?? [],
            'recipient_count' => (int) ($this->recipient_count ?? 0),
            'recipient_snapshot' => $this->recipient_snapshot,
            'creator' => $this->whenLoaded('creator', fn() => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'is_read' => $this->when(
                $request->user(),
                fn() => $this->isReadBy($request->user()->id)
            ),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
