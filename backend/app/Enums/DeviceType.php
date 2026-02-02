<?php

declare(strict_types=1);

namespace App\Enums;

enum DeviceType: string
{
    case ANDROID = 'android';
    case IOS = 'ios';
    case WEB = 'web';
}
