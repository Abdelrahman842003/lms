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
            'current_session_end_time' => $this->getCurrentSessionEndTime(),
        ];
    }

    private function formatTime(): ?string
    {
        if ($this->start_time) {
            return $this->start_time->setTimezone('Africa/Cairo')->translatedFormat('h:i A');
        }
        
        if ($this->recurrence_time) {
            return Carbon::parse($this->recurrence_time)->translatedFormat('h:i A');
        }
        
        return null;
    }

    private function formatDuration(): ?string
    {
        if ($this->start_time && $this->end_time) {
            $minutes = $this->start_time->diffInMinutes($this->end_time, true);
            $hours = $minutes / 60;
            return round($hours, 1) . ' ساعة';
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
            // Calculate next occurrence
            $days = $this->recurrence_days ?? [];
            if (empty($days)) return 'متكررة';

            $today = strtolower(now()->format('l'));
            $nextDay = null;
            
            // Map days to numbers for sorting
            $dayMap = [
                'sunday' => 0, 'monday' => 1, 'tuesday' => 2, 'wednesday' => 3,
                'thursday' => 4, 'friday' => 5, 'saturday' => 6
            ];
            
            $todayNum = $dayMap[$today];
            $sortedDays = [];
            foreach ($days as $day) {
                $lowerDay = strtolower($day);
                if (isset($dayMap[$lowerDay])) {
                    $sortedDays[] = $dayMap[$lowerDay];
                }
            }
            sort($sortedDays);

            // Check if today is a recurrence day
            if (in_array($todayNum, $sortedDays)) {
                // Check if lecture time hasn't passed yet
                if ($this->recurrence_time) {
                    $startTime = Carbon::parse(now()->setTimezone('Africa/Cairo')->format('Y-m-d') . ' ' . $this->recurrence_time, 'Africa/Cairo');
                    $endTime = $startTime->copy()->addMinutes($this->duration_minutes ?? 120);
                    
                    if (now()->setTimezone('Africa/Cairo')->lt($endTime)) {
                        return 'اليوم';
                    }
                }
            }

            // Find next day
            foreach ($sortedDays as $dayNum) {
                if ($dayNum > $todayNum) {
                    $nextDay = $dayNum;
                    break;
                }
            }
            // If no day found later this week, pick the first day next week
            if ($nextDay === null && !empty($sortedDays)) {
                $nextDay = $sortedDays[0];
            }

            if ($nextDay !== null) {
                $arabicDays = [
                    0 => 'الأحد', 1 => 'الاثنين', 2 => 'الثلاثاء', 3 => 'الأربعاء',
                    4 => 'الخميس', 5 => 'الجمعة', 6 => 'السبت'
                ];
                return 'القادمة: ' . $arabicDays[$nextDay];
            }

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
    private function getCurrentSessionEndTime(): ?string
    {
        // If one-time lecture
        if (!$this->is_recurring) {
            return $this->end_time?->toIso8601String();
        }

        // If recurring lecture
        if ($this->is_recurring && $this->recurrence_time && $this->duration_minutes) {
            // Check if today is a recurrence day
            $today = now()->format('l');
            if (in_array($today, $this->recurrence_days ?? [])) {
                $startTime = Carbon::parse(now()->format('Y-m-d') . ' ' . $this->recurrence_time);
                $endTime = $startTime->copy()->addMinutes($this->duration_minutes);
                
                return $endTime->toIso8601String();
            }
        }

        return null;
    }
}
