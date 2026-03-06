<?php

declare(strict_types=1);

namespace App\Domains\Videos\Enums;

enum VideoOwnerType: string
{
    case INDEPENDENT_TEACHER = 'independent_teacher';
    case ACADEMY = 'academy';
}
