<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Academy;

use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Models\Permission;

class PermissionService
{
    /**
     * Get all permissions for secretary guard
     */
    public function getSecretaryPermissions(): Collection
    {
        return Permission::where('guard_name', 'secretary')->get();
    }
}
