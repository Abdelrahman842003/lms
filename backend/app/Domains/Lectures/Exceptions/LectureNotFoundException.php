<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Exceptions;

use App\Domains\Support\Exceptions\ApiException;

class LectureNotFoundException extends ApiException
{
    protected int $statusCode = 404;
    protected string $errorType = 'lecture_not_found';

    public function __construct(string $message = 'المحاضرة غير موجودة')
    {
        parent::__construct($message);
    }
}
