<?php

namespace App\Http\Resources\Teacher;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar' => $this->avatar_key ? env('CLOUDFLARE_R2_PUBLIC_URL') . '/' . $this->avatar_key : null,
            'username' => $this->username,
            'phone' => $this->phone,
            'parent_phone' => $this->parent_phone,
            'gender' => $this->gender,
            'education_type' => $this->education_type,
            'balance' => $this->balance,
            'is_active' => $this->is_active,
            'grade_id' => $this->grade_id,
            'grade_name' => $this->grade ? $this->grade->name : null,
            'group_id' => $this->group_id,
            'group_name' => $this->group ? $this->group->name : null,
            'location' => $this->location,
            'permissions' => $this->getAllPermissions()->pluck('name'),
            
            // Attendance Stats (Current Month)
            'attendance_stats' => $this->calculateAttendanceStats(),
            
            // Exam Stats
            'exam_stats' => $this->calculateExamStats(),
            
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function calculateAttendanceStats()
    {
        $currentMonth = now()->month;
        $attendances = $this->attendances->filter(function ($attendance) use ($currentMonth) {
            return $attendance->created_at->month === $currentMonth;
        });

        $presentCount = $attendances->where('status', 'present')->count();
        // User mentioned 8 lectures per month as a baseline
        $totalLectures = 8; 
        
        return [
            'present_count' => $presentCount,
            'total_lectures' => $totalLectures,
            'average' => $totalLectures > 0 ? round(($presentCount / $totalLectures) * 100, 1) : 0,
        ];
    }

    private function calculateExamStats()
    {
        $currentMonth = now()->month;
        
        // All results
        $results = $this->examResults->map(function ($result) {
            return [
                'exam_title' => $result->exam->title,
                'score' => $result->score,
                'max_score' => $result->exam->max_score,
                'percentage' => $result->exam->max_score > 0 ? round(($result->score / $result->exam->max_score) * 100, 1) : 0,
                'date' => $result->exam->date,
            ];
        });

        // Current month average
        $monthResults = $this->examResults->filter(function ($result) use ($currentMonth) {
             // Assuming exam date is what matters, or result creation date? 
             // Using exam date from the relationship
             return \Carbon\Carbon::parse($result->exam->date)->month === $currentMonth;
        });

        $totalPercentage = 0;
        $count = 0;

        foreach ($monthResults as $result) {
            if ($result->exam->max_score > 0) {
                $totalPercentage += ($result->score / $result->exam->max_score) * 100;
                $count++;
            }
        }

        return [
            'results' => $results,
            'month_average' => $count > 0 ? round($totalPercentage / $count, 1) : 0,
        ];
    }
}
