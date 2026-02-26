<?php

declare(strict_types=1);

namespace App\Domains\Support\Exceptions;

class SubscriptionExpiredException extends DomainException
{
    protected int $statusCode = 403;
    protected string $errorType = 'subscription_expired';

    public function __construct(string $message = 'انتهت صلاحية الاشتراك')
    {
        parent::__construct($message);
    }
}
