<?php

declare(strict_types=1);

namespace App\Exceptions;

class QuotaExceededException extends ApiException
{
    protected int $statusCode = 422;
    protected string $errorType = 'quota_exceeded';

    private ?int $currentCount;
    private ?int $maxAllowed;
    private ?int $remainingSeats;

    public function __construct(
        string $message = 'لقد وصلت للحد الأقصى من الطلاب',
        ?int $currentCount = null,
        ?int $maxAllowed = null,
        ?int $remainingSeats = null
    ) {
        $this->currentCount = $currentCount;
        $this->maxAllowed = $maxAllowed;
        $this->remainingSeats = $remainingSeats;

        parent::__construct($message);
    }

    public function render($request): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'status' => false,
            'status_code' => $this->statusCode,
            'error_type' => $this->errorType,
            'message' => $this->getMessage(),
            'data' => [
                'current_count' => $this->currentCount,
                'max_allowed' => $this->maxAllowed,
                'remaining_seats' => $this->remainingSeats,
            ],
        ], $this->statusCode);
    }

    public function getCurrentCount(): ?int
    {
        return $this->currentCount;
    }

    public function getMaxAllowed(): ?int
    {
        return $this->maxAllowed;
    }

    public function getRemainingSeats(): ?int
    {
        return $this->remainingSeats;
    }
}
