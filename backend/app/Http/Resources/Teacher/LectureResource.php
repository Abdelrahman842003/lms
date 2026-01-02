<?php

declare(strict_types=1);

namespace App\Http\Resources\Teacher;

use Carbon\Carbon;
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
            'start_time' => $this->start_time?->format('Y-m-d H:i'),
            'end_time' => $this->end_time?->format('Y-m-d H:i'),
            'date' => $this->start_time?->format('Y-m-d'),
            'time' => $this->formatTime(),
            'duration' => $this->formatDuration(),
            'enrolled' => $this->attendances_count,
            'present_count' => $this->present_count ?? 0,
            'status' => $this->getStatus(),
            'is_active' => $this->is_active,
            'grade' => $this->whenLoaded('grade', fn() => [
                'id' => $this->grade->id,
                'name' => $this->grade->name,
            ]),
            'grade_id' => $this->grade_id,
            'group' => $this->whenLoaded('group', fn() => [
                'id' => $this->group->id,
                'name' => $this->group->name,
            ]),
            'group_id' => $this->group_id,
            'created_at' => $this->created_at,
            'is_recurring' => $this->is_recurring,
            'recurrence_days' => $this->recurrence_days,
            'cancelled_dates' => $this->cancelled_dates,
        ];
    }

    private function formatTime(): ?string
    {
        if ($this->start_time) {
            return $this->start_time->format('h:i A');
        }
        
        if ($this->recurrence_time) {
            return Carbon::parse($this->recurrence_time)->format('h:i A');
        }
        
        return null;
    }

    private function formatDuration(): ?string
    {
        if ($this->start_time && $this->end_time) {
            return $this->start_time->diffInHours($this->end_time) . ' ساعة';
        }
        
        if ($this->duration_minutes) {
            return round($this->duration_minutes / 60, 1) . ' ساعة';
        }
        
        return null;
    }

    private function getStatus(): string
    {
        if ($this->is_active) {
            return 'جاري الآن';
        }

        if ($this->is_recurring) {
            return 'متكررة';
        }

        if (!$this->start_time || !$this->end_time) {
            return 'غير محدد';
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
