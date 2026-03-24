<?php

declare(strict_types=1);

namespace App\Domains\Application\Exceptions;

class SeatLimitException extends DomainException
{
    protected int $statusCode = 422;
    protected string $errorType = 'seat_limit_exceeded';

    public function __construct(string $message = 'تم الوصول للحد الأقصى من المقاعد')
    {
        parent::__construct($message);
    }
}
