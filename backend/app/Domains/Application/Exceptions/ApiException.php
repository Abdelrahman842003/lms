<?php

declare(strict_types=1);

namespace App\Domains\Application\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

abstract class ApiException extends Exception
{
    protected int $statusCode = 400;
    protected string $errorType = 'error';

    public function render($request): JsonResponse
    {
        return response()->json([
            'status' => false,
            'status_code' => $this->statusCode,
            'error_type' => $this->errorType,
            'message' => $this->getMessage(),
        ], $this->statusCode);
    }
}
