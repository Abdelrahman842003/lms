<?php

declare(strict_types=1);

namespace App\Domains\Auth\Exceptions;

use App\Domains\Support\Exceptions\ApiException;

class TokenUserNotFoundException extends ApiException
{
    protected int $statusCode = 404;
    protected string $errorType = 'token_user_not_found';

    public function __construct(string $message = 'User not found for token')
    {
        parent::__construct($message);
    }
}
