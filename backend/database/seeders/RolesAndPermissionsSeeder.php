<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // create permissions
        $permissions = [
            'view users',
            'create users',
            'edit users',
            'delete users',
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',
            'view permissions',
            'create permissions',
            'edit permissions',
            'delete permissions',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'admin']);
        }

        // create roles and assign created permissions

        // Super Admin
        $role = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'admin']);
        $role->givePermissionTo(Permission::where('guard_name', 'admin')->get());

        // Admin
        $role = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'admin']);
        $role->givePermissionTo(['view users', 'create users', 'edit users', 'view roles', 'view permissions']);

        // Teacher (if needed for admin panel management)
        // Role::create(['name' => 'Teacher', 'guard_name' => 'admin']);
    }
}
