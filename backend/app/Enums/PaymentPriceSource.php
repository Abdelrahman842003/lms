<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentPriceSource: string
{
    case GRADE = 'grade';
    case GROUP = 'group';
}
