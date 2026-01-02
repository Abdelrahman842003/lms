<?php

declare(strict_types=1);

namespace App\Exceptions;

class UnauthorizedException extends ApiException
{
    protected int $statusCode = 403;
    protected string $errorType = 'unauthorized';

    public function __construct(string $message = 'غير مصرح لك بهذا الإجراء')
    {
        parent::__construct($message);
    }
}
