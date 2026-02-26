<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Resources\Student;

use Illuminate\Http\Resources\Json\JsonResource;

class StudentNotificationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'message' => $this->message,
            'recipient_type' => $this->recipient_type,
            'recipient_count' => $this->recipient_count,
            'is_voice' => $this->is_voice ?? false,
            'voice_url' => $this->voice_url ?? null,
            'voice_duration' => $this->voice_duration ?? null,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
