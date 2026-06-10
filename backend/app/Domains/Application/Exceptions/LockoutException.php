<?php

declare(strict_types=1);

namespace App\Domains\Application\Exceptions;

use Illuminate\Http\JsonResponse;

class LockoutException extends DomainException
{
    protected string $errorType = 'lockout_error';
    private int $remainingSeconds;

    public function __construct(string $message, int $remainingSeconds)
    {
        parent::__construct($message);
        $this->remainingSeconds = $remainingSeconds;
    }

    public function getRemainingSeconds(): int
    {
        return $this->remainingSeconds;
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'status'      => false,
            'status_code' => $this->statusCode,
            'error_type'  => $this->errorType,
            'message'     => $this->getMessage(),
            'data'        => [
                'remaining_seconds' => $this->remainingSeconds
            ]
        ], $this->statusCode);
    }
}
