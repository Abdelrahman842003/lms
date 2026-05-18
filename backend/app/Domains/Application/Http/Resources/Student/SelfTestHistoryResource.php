<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Resources\Student;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SelfTestHistoryResource extends JsonResource
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
            'exam_id' => $this->exam_id,
            'status' => $this->status->value ?? $this->status,
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'total_questions' => count($this->questions_order ?? []),
            'score' => $this->result?->score,
            'percentage' => $this->result?->percentage,
            'exam_title' => $this->exam->title ?? 'اختبر نفسك',
            'subject' => $this->exam->subject ?? 'تدريب عام',
        ];
    }
}
