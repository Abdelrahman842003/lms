<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Resources\Academy;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isDatabaseNotification = $this->resource instanceof \Illuminate\Notifications\DatabaseNotification;

        if ($isDatabaseNotification) {
            return [
                'id' => $this->id,
                'type' => $this->data['type'] ?? 'general',
                'data' => [
                    'title' => $this->data['title'] ?? 'إشعار جديد',
                    'message' => $this->data['message'] ?? '',
                    'type' => $this->data['type'] ?? 'general',
                    'target_type' => $this->data['target_type'] ?? 'all',
                    'target_ids' => $this->data['target_ids'] ?? [],
                    'recipient_count' => (int) ($this->data['recipient_count'] ?? 0),
                    'recipient_snapshot' => $this->data['recipient_snapshot'] ?? null,
                ],
                'creator' => null,
                'is_read' => $this->read_at !== null,
                'created_at' => $this->created_at?->toISOString(),
            ];
        }

        return [
            'id' => $this->id,
            'type' => $this->type,
            'data' => [
                'title' => $this->title,
                'message' => $this->message,
                'type' => $this->type,
                'target_type' => $this->target_type,
                'target_ids' => $this->target_ids ?? [],
                'recipient_count' => (int) ($this->recipient_count ?? 0),
                'recipient_snapshot' => $this->recipient_snapshot,
            ],
            'creator' => $this->whenLoaded('creator', fn() => [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ]),
            'is_read' => $this->when(
                $request->user(),
                fn() => method_exists($this->resource, 'isReadBy') 
                    ? $this->isReadBy($request->user()->id) 
                    : ($this->read_at !== null)
            ),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
