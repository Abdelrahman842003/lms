<?php

declare(strict_types=1);

namespace App\Domains\Auth\Exceptions;

use App\Domains\Support\Exceptions\ApiException;

class InvalidRefreshTokenException extends ApiException
{
    protected int $statusCode = 401;
    protected string $errorType = 'invalid_refresh_token';

    public function __construct(string $message = 'Invalid refresh token')
    {
        parent::__construct($message);
    }
}
