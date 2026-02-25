<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class FilamentPermissionSeeder extends Seeder
{
    /**
     * Resources that need permissions managed.
     */
    protected array $resources = [
        'admins',
        'academies',
        'teachers',
        'students',
        'secretaries',
        'subscriptions',
        'roles',
        'permissions',
        'settings',
    ];

    /**
     * Additional permissions for specific resources.
     */
    protected array $additionalPermissions = [
        'settings' => ['manage'],
        'reports' => ['view', 'export'],
        'dashboard' => ['view'],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions for all resources
        $this->createResourcePermissions();

        // Create additional custom permissions
        $this->createAdditionalPermissions();

        // Create filament-admin role with all permissions
        $adminRole = $this->createAdminRole();

        // Create or update admin user
        $this->createAdminUser($adminRole);
    }

    /**
     * Create CRUD permissions for all resources.
     */
    protected function createResourcePermissions(): void
    {
        $actions = ['view_any', 'view', 'create', 'update', 'delete', 'restore', 'force_delete'];

        foreach ($this->resources as $resource) {
            foreach ($actions as $action) {
                Permission::firstOrCreate([
                    'name' => "{$resource}.{$action}",
                    'guard_name' => 'admin',
                ], [
                    'group' => $resource,
                ]);
            }
        }

        $this->command->info('Created permissions for ' . count($this->resources) . ' resources');
    }

    /**
     * Create additional custom permissions.
     */
    protected function createAdditionalPermissions(): void
    {
        foreach ($this->additionalPermissions as $resource => $actions) {
            foreach ($actions as $action) {
                Permission::firstOrCreate([
                    'name' => "{$resource}.{$action}",
                    'guard_name' => 'admin',
                ], [
                    'group' => $resource,
                ]);
            }
        }

        $this->command->info('Created additional permissions');
    }

    /**
     * Create the filament-admin role with all permissions.
     */
    protected function createAdminRole(): Role
    {
        $role = Role::firstOrCreate([
            'name' => 'filament-admin',
            'guard_name' => 'admin',
        ], [
            'description' => 'Full access to Filament admin panel with all permissions',
        ]);

        // Get all admin permissions
        $permissions = Permission::where('guard_name', 'admin')->get();

        // Sync all permissions to the role
        $role->syncPermissions($permissions);

        $this->command->info("Created 'filament-admin' role with {$permissions->count()} permissions");

        return $role;
    }

    /**
     * Create the main admin user.
     */
    protected function createAdminUser(Role $role): void
    {
        $adminData = [
            'name' => 'Super Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'is_active' => true,
            'email_verified_at' => now(),
        ];

        $admin = Admin::firstOrCreate(
            ['email' => $adminData['email']],
            $adminData
        );

        // Assign the filament-admin role
        $admin->assignRole($role);

        $this->command->info("Created admin user: {$adminData['email']} / password: password");
        $this->command->warn('Please change the default password after first login!');
    }

    /**
     * Create additional roles for specific use cases.
     */
    public function createAdditionalRoles(): void
    {
        // Content Manager - Can manage academies, teachers, students
        $contentManager = Role::firstOrCreate([
            'name' => 'content-manager',
            'guard_name' => 'admin',
        ]);

        $contentManager->givePermissionTo([
            'academies.view_any', 'academies.view', 'academies.create', 'academies.update',
            'teachers.view_any', 'teachers.view', 'teachers.create', 'teachers.update',
            'students.view_any', 'students.view', 'students.create', 'students.update',
            'secretaries.view_any', 'secretaries.view', 'secretaries.create', 'secretaries.update',
        ]);

        // Finance Manager - Can manage subscriptions and view reports
        $financeManager = Role::firstOrCreate([
            'name' => 'finance-manager',
            'guard_name' => 'admin',
        ]);

        $financeManager->givePermissionTo([
            'subscriptions.view_any', 'subscriptions.view', 'subscriptions.create', 'subscriptions.update', 'subscriptions.delete',
            'reports.view', 'reports.export',
            'academies.view_any', 'academies.view',
        ]);

        // Read Only - Can only view data
        $readOnly = Role::firstOrCreate([
            'name' => 'read-only',
            'guard_name' => 'admin',
        ]);

        $readOnly->givePermissionTo([
            'admins.view_any', 'admins.view',
            'academies.view_any', 'academies.view',
            'teachers.view_any', 'teachers.view',
            'students.view_any', 'students.view',
            'secretaries.view_any', 'secretaries.view',
            'subscriptions.view_any', 'subscriptions.view',
            'roles.view_any', 'roles.view',
            'permissions.view_any', 'permissions.view',
            'settings.view',
            'dashboard.view',
            'reports.view',
        ]);

        $this->command->info('Created additional roles: content-manager, finance-manager, read-only');
    }
}
