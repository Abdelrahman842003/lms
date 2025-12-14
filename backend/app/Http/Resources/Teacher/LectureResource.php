<?php

namespace App\Http\Resources\Teacher;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LectureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'price' => $this->price,
            'start_time' => $this->start_time->format('Y-m-d H:i'),
            'end_time' => $this->end_time->format('Y-m-d H:i'),
            'date' => $this->start_time->format('Y-m-d'),
            'time' => $this->start_time->format('h:i A'),
            'duration' => $this->start_time->diffInHours($this->end_time) . ' ساعة',
            'enrolled' => $this->attendances_count,
            'status' => $this->getStatus(),
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
        ];
    }

    private function getStatus()
    {
        if ($this->is_active) {
            return 'جاري الآن';
        }

        $now = now();
        
        if ($now->gt($this->end_time)) {
            return 'منتهية';
        }

        if ($now->isSameDay($this->start_time)) {
            return 'اليوم';
        }

        return 'قادمة';
    }
}
