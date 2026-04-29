<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Filament\Facades\Filament;
use Illuminate\Support\Str;

class PermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Get all Filament Resources and Pages
        $panel = Filament::getPanel('admin');
        $resources = $panel->getResources();
        $pages = $panel->getPages();

        $guard = 'admin';
        $permissions = [];

        // 2. Generate permissions for Resources
        foreach ($resources as $resource) {
            $name = Str::snake(Str::plural(class_basename($resource)));
            
            $actions = ['view_any', 'view', 'create', 'update', 'delete', 'restore', 'force_delete'];
            
            foreach ($actions as $action) {
                $permissions[] = "{$name}.{$action}";
            }
        }

        // 3. Generate permissions for Pages
        foreach ($pages as $page) {
            $name = Str::snake(class_basename($page));
            $permissions[] = "page_{$name}.view";
        }

        // 4. Custom Permissions
        $customPermissions = [
            'settings.manage',
            'reports.view',
            'reports.export',
            'dashboard.view',
        ];

        $allPermissions = array_unique(array_merge($permissions, $customPermissions));

        // 5. Create Permissions in Database
        foreach ($allPermissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => $guard,
            ]);
        }

        $this->command->info('Dynamic permissions generated: ' . count($allPermissions));

        // 6. Create Super Admin Role and assign all permissions
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => $guard]);
        $superAdminRole->syncPermissions(Permission::where('guard_name', $guard)->get());
        
        $this->command->info('Super Admin role synchronized with all permissions.');
    }
}
