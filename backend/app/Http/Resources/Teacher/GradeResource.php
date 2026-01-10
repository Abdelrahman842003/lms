<?php

namespace App\Http\Resources\Teacher;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $teacher = $this->teacher;
        if (!$teacher && $this->teacher_id) {
            $teacher = \App\Models\Teacher::find($this->teacher_id);
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'price' => (float) $this->price,
            'groups_count' => (int) $this->groups_count,
            'students_count' => (int) $this->enrollments_count,
            'teacher_id' => $this->teacher_id,
            'teacher' => $teacher ? [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'avatar' => $teacher->avatar,
            ] : null,
            'created_at' => $this->created_at,
        ];
    }
}
