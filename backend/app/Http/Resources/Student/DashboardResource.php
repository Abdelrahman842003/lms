<?php

declare(strict_types=1);

namespace App\Http\Resources\Student;

use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'stats' => [
                'walletBalance' => $this->enrollment ? $this->enrollment->balance : 0,
                'mistakesCount' => $this->mistakes_count ?? 0,
                'totalPoints' => $this->total_points ?? 0,
                'attendanceRate' => $this->attendance_rate ?? 0,
                'examAverage' => round($this->exam_average ?? 0, 1),
            ],
            'upcomingLectures' => $this->upcoming_lectures ?? [],
            'latestNews' => $this->latest_news ?? [],
        ];
    }
}
