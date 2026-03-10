<?php

declare(strict_types=1);

namespace App\Domains\Videos\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VideoCommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'video_id' => $this->video_id,
            'parent_id' => $this->parent_id,
            'body' => $this->body,
            'is_hidden' => (bool) $this->is_hidden,
            'author' => [
                'type' => class_basename((string) $this->author_type),
                'id' => $this->author_id,
                'name' => $this->author?->name,
            ],
            'created_at' => $this->created_at,
            'replies' => self::collection($this->whenLoaded('replies')),
        ];
    }
}
