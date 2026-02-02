<?php

declare(strict_types=1);

namespace App\Enums;

enum StudentActivityAction: string
{
    case ENROLLED = 'enrolled';
    case UNENROLLED = 'unenrolled';
    case GROUP_CHANGE = 'group_change';
    case GRADE_CHANGE = 'grade_change';
    case PAYMENT = 'payment';
    case DEDUCTION = 'deduction';
    case MERGED = 'merged';
    case STATUS_CHANGE = 'status_change';
}
