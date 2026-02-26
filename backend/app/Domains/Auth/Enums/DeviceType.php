<?php

declare(strict_types=1);

namespace App\Domains\Auth\Enums;

enum DeviceType: string
{
    case ANDROID = 'android';
    case IOS = 'ios';
    case WEB = 'web';
}
