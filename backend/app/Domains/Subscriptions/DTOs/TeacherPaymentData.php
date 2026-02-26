<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\DTOs;

use Illuminate\Http\Request;

readonly class TeacherPaymentData
{
    public function __construct(
        public string $student_id,
        public int $months,
        public float $discount,
        public ?string $notes,
        public string $client_side_uuid,
        public ?string $start_date = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            student_id: $request->validated('student_id'),
            months: (int) $request->validated('months'),
            discount: (float) ($request->validated('discount') ?? 0),
            notes: $request->validated('notes'),
            client_side_uuid: $request->validated('client_side_uuid'),
            start_date: $request->validated('start_date'),
        );
    }

    public function toArray(): array
    {
        return [
            'student_id' => $this->student_id,
            'months' => $this->months,
            'discount' => $this->discount,
            'notes' => $this->notes,
            'client_side_uuid' => $this->client_side_uuid,
            'start_date' => $this->start_date,
        ];
    }
}
