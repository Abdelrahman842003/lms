<?php

declare(strict_types=1);

namespace App\Domains\Notes\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'academy_id' => $this->academy_id,
            'teacher_id' => $this->teacher_id,
            'grade_id' => $this->grade_id,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'grade' => $this->whenLoaded('grade'),
            'teacher' => $this->whenLoaded('teacher'),
            'groups' => $this->whenLoaded('groups'),
            'attachments' => $this->whenLoaded('attachments'),
        ];
    }
}
