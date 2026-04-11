<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // Enrollment data
            'enrollment_id' => $this->id,
            'is_active' => $this->is_active,
            'balance' => $this->balance,
            'grade_id' => $this->grade_id,
            'grade_name' => $this->whenLoaded('grade', fn() => $this->grade->name),
            'group_id' => $this->group_id,
            'group_name' => $this->whenLoaded('group', fn() => $this->group->name),
            'subscription_start' => $this->subscription_start,
            'subscription_end' => $this->subscription_end,
            'status' => $this->status,
            'days_left' => $this->days_left,
            'trial_ends_at' => $this->when($this->status === 'trial', $this->trial_ends_at),
            'trial_days_left' => $this->when(
                $this->status === 'trial' && $this->trial_ends_at,
                fn() => max(0, now()->diffInDays($this->trial_ends_at, false))
            ),
            'teacher_notes' => $this->teacher_notes,
            'enrolled_at' => $this->created_at,
            
            // Student data
            'id' => $this->whenLoaded('student', fn() => $this->student->id),
            'name' => $this->whenLoaded('student', fn() => $this->student->name),
            'avatar' => $this->whenLoaded('student', fn() => $this->student->avatar_key 
                ? config('filesystems.disks.r2.url') . '/' . $this->student->avatar_key 
                : null),
            'phone' => $this->whenLoaded('student', fn() => $this->student->phone),
            'parent_phone' => $this->whenLoaded('student', fn() => $this->student->parent_phone),
            'gender' => $this->whenLoaded('student', fn() => $this->student->gender),
            'education_type' => $this->whenLoaded('student', fn() => $this->student->education_type),
            'location' => $this->whenLoaded('student', fn() => $this->student->location),
            'permissions' => $this->whenLoaded('student', fn() => $this->student->getAllPermissions()->pluck('name')),
            
            // Exam Stats
            'exam_stats' => $this->whenLoaded('student', fn() => $this->calculateExamStats($this->student)),
            
            'created_at' => $this->whenLoaded('student', fn() => $this->student->created_at),
            'updated_at' => $this->updated_at,
        ];
    }

    private function calculateExamStats($student)
    {
        // Only load if relationship is loaded
        if (!$student->relationLoaded('examResults')) {
            return [
                'results' => [],
                'month_average' => 0,
            ];
        }

        $currentMonth = now()->month;
        
        $examResults = $student->examResults;
        
        // Check if exam relationship is eager-loaded to avoid N+1
        // If not loaded, we need to load it efficiently
        $firstResult = $examResults->first();
        if ($firstResult && !$firstResult->relationLoaded('exam')) {
            // Load exam relationship for all results at once to avoid N+1
            $examResults->load('exam:id,title,max_score,date');
        }
        
        $results = $examResults->map(function ($result) {
            // Guard against missing exam relationship
            if (!$result->exam) {
                return [
                    'exam_title' => 'Unknown',
                    'score' => $result->score,
                    'max_score' => 0,
                    'percentage' => 0,
                    'date' => null,
                ];
            }
            
            return [
                'exam_title' => $result->exam->title,
                'score' => $result->score,
                'max_score' => $result->exam->max_score,
                'percentage' => $result->exam->max_score > 0 ? round(($result->score / $result->exam->max_score) * 100, 1) : 0,
                'date' => $result->exam->date,
            ];
        });

        $monthResults = $examResults->filter(function ($result) use ($currentMonth) {
            // Guard against missing exam
            if (!$result->exam || !$result->exam->date) {
                return false;
            }
            return \Carbon\Carbon::parse($result->exam->date)->month === $currentMonth;
        });

        $totalPercentage = 0;
        $count = 0;

        foreach ($monthResults as $result) {
            if ($result->exam && $result->exam->max_score > 0) {
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
