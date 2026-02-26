<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class StudentLectureResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'date' => $this->start_time->format('Y-m-d'),
            'time' => $this->start_time->format('H:i'),
            'iso_start_time' => $this->start_time->toIso8601String(),
            'iso_end_time' => $this->end_time->toIso8601String(),
            'duration' => $this->start_time->diffInMinutes($this->end_time),
            'is_recurring' => $this->is_recurring,
            'recurrence_days' => $this->recurrence_days,
            'is_active' => $this->is_active,
            'is_attended' => $this->is_attended ?? false,
            'grade' => $this->whenLoaded('grade', function () {
                return [
                    'id' => $this->grade->id ?? null,
                    'name' => $this->grade->name ?? null,
                ];
            }),
            'group' => $this->whenLoaded('group', function () {
                return [
                    'id' => $this->group->id ?? null,
                    'name' => $this->group->name ?? null,
                ];
            }),
            'teacher' => $this->whenLoaded('teacher', function () {
                return [
                    'id' => $this->teacher->id,
                    'name' => $this->teacher->name,
                ];
            }),
        ];
    }
}
