<?php

declare(strict_types=1);

namespace App\Domains\Exams\Exceptions;

use App\Domains\Application\Exceptions\ApiException;

class ExamNotFoundException extends ApiException
{
    protected int $statusCode = 404;
    protected string $errorType = 'exam_not_found';

    public function __construct(string $message = 'الامتحان غير موجود')
    {
        parent::__construct($message);
    }
}
