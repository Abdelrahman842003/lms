<?php

declare(strict_types=1);

namespace App\Domains\Auth\Exceptions;

use App\Domains\Application\Exceptions\ApiException;

class StudentNotFoundException extends ApiException
{
    protected int $statusCode = 404;
    protected string $errorType = 'student_not_found';

    public function __construct(string $message = 'الطالب غير موجود')
    {
        parent::__construct($message);
    }
}
