<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Resources\Teacher;

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
            'avatar' => $this->avatar_key ? config('filesystems.disks.r2.url') . '/' . $this->avatar_key : null,
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
            
            // Exam Stats
            'exam_stats' => $this->calculateExamStats(),
            
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function calculateExamStats()
    {
        $currentMonth = now()->month;
        
        $examResults = $this->examResults;
        
        // Check if exam relationship is eager-loaded to avoid N+1
        // If not loaded, we need to load it efficiently
        $firstResult = $examResults->first();
        if ($firstResult && !$firstResult->relationLoaded('exam')) {
            // Load exam relationship for all results at once to avoid N+1
            $examResults->load('exam:id,title,max_score,date');
        }
        
        // All results
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

        // Current month average
        $monthResults = $examResults->filter(function ($result) use ($currentMonth) {
            // Guard against missing exam
            if (!$result->exam || !$result->exam->date) {
                return false;
            }
            // Using exam date from the relationship
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
