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
            'start_time' => $this->start_time ? $this->start_time->format('Y-m-d H:i') : null,
            'end_time' => $this->end_time ? $this->end_time->format('Y-m-d H:i') : null,
            'date' => $this->start_time ? $this->start_time->format('Y-m-d') : null,
            'time' => $this->start_time ? $this->start_time->format('h:i A') : ($this->recurrence_time ? \Carbon\Carbon::parse($this->recurrence_time)->format('h:i A') : null),
            'duration' => $this->start_time && $this->end_time 
                ? $this->start_time->diffInHours($this->end_time) . ' ساعة' 
                : ($this->duration_minutes ? round($this->duration_minutes / 60, 1) . ' ساعة' : null),
            'enrolled' => $this->attendances_count,
            'present_count' => $this->present_count ?? 0,
            'status' => $this->getStatus(),
            'is_active' => $this->is_active,
            'grade' => $this->grade ? [
                'id' => $this->grade->id,
                'name' => $this->grade->name,
            ] : null,
            'grade_id' => $this->grade_id,
            'group' => $this->group ? [
                'id' => $this->group->id,
                'name' => $this->group->name,
            ] : null,
            'group_id' => $this->group_id,
            'created_at' => $this->created_at,
            'is_recurring' => $this->is_recurring,
            'recurrence_days' => $this->recurrence_days,
            'cancelled_dates' => $this->cancelled_dates,
        ];
    }

    private function getStatus()
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
