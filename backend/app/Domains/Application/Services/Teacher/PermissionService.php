<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use Spatie\Permission\Models\Permission;
use Illuminate\Database\Eloquent\Collection;

class PermissionService
{
    public function getPermissions(): Collection
    {
        return Permission::whereIn('guard_name', ['student', 'secretary'])->get();
    }

    public function createPermission(array $data): Permission
    {
        if (Permission::where('name', $data['name'])->where('guard_name', $data['guard_name'])->exists()) {
             throw new \Exception('اسم الصلاحية مستخدم بالفعل لهذا النوع.', 422);
        }

        return Permission::create(['name' => $data['name'], 'guard_name' => $data['guard_name']]);
    }

    public function updatePermission(Permission $permission, array $data): Permission
    {
        if ($permission->name !== $data['name']) {
            if (Permission::where('name', $data['name'])->where('guard_name', $permission->guard_name)->exists()) {
                 throw new \Exception('اسم الصلاحية مستخدم بالفعل لهذا النوع.', 422);
            }
        }

        $permission->update(['name' => $data['name']]);

        return $permission;
    }

    public function deletePermission(Permission $permission): void
    {
        $permission->delete();
    }
}
