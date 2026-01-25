<?php

declare(strict_types=1);

namespace App\DTOs\Academy;

use Illuminate\Http\Request;

readonly class InstapayPaymentData
{
    public function __construct(
        public int $month,
        public int $year,
        public float $amount,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            month: (int) $request->validated('month'),
            year: (int) $request->validated('year'),
            amount: (float) $request->validated('amount'),
        );
    }

    public function toArray(): array
    {
        return [
            'month' => $this->month,
            'year' => $this->year,
            'amount' => $this->amount,
        ];
    }
}
