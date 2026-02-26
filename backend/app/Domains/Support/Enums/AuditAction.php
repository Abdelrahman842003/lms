<?php

declare(strict_types=1);

namespace App\Domains\Support\Enums;

enum AuditAction: string
{
    case CREATED  = 'created';
    case UPDATED  = 'updated';
    case DELETED  = 'deleted';
    case RESTORED = 'restored';
    case LOGGED_IN  = 'logged_in';
    case LOGGED_OUT = 'logged_out';
    case EXPORTED   = 'exported';
    case ROLE_CHANGED       = 'role_changed';
    case PERMISSION_CHANGED = 'permission_changed';
    case PASSWORD_CHANGED   = 'password_changed';
    case SUSPENDED          = 'suspended';
    case ACTIVATED          = 'activated';

    public function label(): string
    {
        return match($this) {
            self::CREATED            => 'أُنشئ',
            self::UPDATED            => 'عُدِّل',
            self::DELETED            => 'حُذف',
            self::RESTORED           => 'استُرجع',
            self::LOGGED_IN          => 'تسجيل دخول',
            self::LOGGED_OUT         => 'تسجيل خروج',
            self::EXPORTED           => 'تصدير',
            self::ROLE_CHANGED       => 'تغيير دور',
            self::PERMISSION_CHANGED => 'تغيير صلاحية',
            self::PASSWORD_CHANGED   => 'تغيير كلمة المرور',
            self::SUSPENDED          => 'إيقاف',
            self::ACTIVATED          => 'تفعيل',
        };
    }
}
