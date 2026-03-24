<?php

declare(strict_types=1);

namespace App\Domains\Application\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Base exception for all domain-level errors.
 * ترميها من Actions/Services وتُعالج تلقائياً في الـ Handler.
 */
class DomainException extends Exception
{
    protected int $statusCode = Response::HTTP_BAD_REQUEST;
    protected string $errorType = 'domain_error';

    public function __construct(
        string $message = 'حدث خطأ في العملية',
        int $code = 0,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'status'      => false,
            'status_code' => $this->statusCode,
            'error_type'  => $this->errorType,
            'message'     => $this->getMessage(),
        ], $this->statusCode);
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
