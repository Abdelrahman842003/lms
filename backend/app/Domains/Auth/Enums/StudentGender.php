<?php

declare(strict_types=1);

namespace App\Domains\Auth\Enums;

enum StudentGender: string
{
    case MALE = 'male';
    case FEMALE = 'female';
}
