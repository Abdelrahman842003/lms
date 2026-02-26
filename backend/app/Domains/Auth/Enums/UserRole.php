<?php

declare(strict_types=1);

namespace App\Domains\Auth\Enums;

enum UserRole: string
{
    case SUPER_ADMIN  = 'super_admin';
    case ADMIN        = 'admin';
    case ORG_ADMIN    = 'org_admin';
    case TEACHER      = 'teacher';
    case SECRETARY    = 'secretary';
    case STUDENT      = 'student';
    case PARENT       = 'parent';

    public function label(): string
    {
        return match($this) {
            self::SUPER_ADMIN => 'مدير النظام',
            self::ADMIN       => 'مشرف',
            self::ORG_ADMIN   => 'مدير المنظمة',
            self::TEACHER     => 'مدرس',
            self::SECRETARY   => 'سكرتير',
            self::STUDENT     => 'طالب',
            self::PARENT      => 'ولي أمر',
        };
    }

    /** Roles that can manage content */
    public function isManagementRole(): bool
    {
        return in_array($this, [self::SUPER_ADMIN, self::ADMIN, self::ORG_ADMIN, self::TEACHER, self::SECRETARY]);
    }
}
