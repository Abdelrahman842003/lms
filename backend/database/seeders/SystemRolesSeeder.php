<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class SystemRolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Admin Guard Permissions & Roles
        $adminPermissions = [
            'view users', 'create users', 'edit users', 'delete users',
            'view roles', 'create roles', 'edit roles', 'delete roles',
            'view permissions', 'create permissions', 'edit permissions', 'delete permissions',
            'view settings', 'manage settings',
            'view dashboard', 'view reports',
        ];

        foreach ($adminPermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'admin']);
        }

        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'admin']);
        $superAdmin->syncPermissions(Permission::where('guard_name', 'admin')->get());

        // 2. Secretary Guard Permissions & Roles
        $secretaryPermissions = [
            'view students', 'create students', 'edit students', 'delete students', 'manage student groups',
            'view lectures', 'create lectures', 'edit lectures', 'delete lectures', 'manage lecture attendance',
            'view exams', 'create exams', 'edit exams', 'delete exams', 'grade exams',
            'view grades', 'create grades', 'edit grades', 'delete grades',
            'view groups', 'create groups', 'edit groups', 'delete groups',
            'view dashboard', 'view reports',
            'send notifications',
        ];

        foreach ($secretaryPermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'secretary']);
        }

        // Teacher Secretary - Can manage everything a teacher can (except maybe teacher settings)
        $teacherSecretary = Role::firstOrCreate(['name' => 'Teacher Secretary', 'guard_name' => 'secretary']);
        $teacherSecretary->syncPermissions(Permission::where('guard_name', 'secretary')->get());

        // Academy Secretary - Might have a different set if needed later
        $academySecretary = Role::firstOrCreate(['name' => 'Academy Secretary', 'guard_name' => 'secretary']);
        $academySecretary->syncPermissions(['view students', 'view lectures', 'view exams', 'view dashboard', 'view reports']);
    }
}
