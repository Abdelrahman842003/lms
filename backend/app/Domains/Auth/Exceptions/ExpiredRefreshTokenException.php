<?php

declare(strict_types=1);

namespace App\Domains\Auth\Exceptions;

use App\Domains\Support\Exceptions\ApiException;

class ExpiredRefreshTokenException extends ApiException
{
    protected int $statusCode = 401;
    protected string $errorType = 'expired_refresh_token';

    public function __construct(string $message = 'Refresh token expired')
    {
        parent::__construct($message);
    }
}
