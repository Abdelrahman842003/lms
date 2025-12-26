<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class SecretaryPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Define permissions for secretaries (Teacher capabilities)
        $permissions = [
            // Students
            'view students',
            'create students',
            'edit students',
            'delete students',
            'manage student groups',
            
            // Lectures
            'view lectures',
            'create lectures',
            'edit lectures',
            'delete lectures',
            'manage lecture attendance',
            
            // Exams
            'view exams',
            'create exams',
            'edit exams',
            'delete exams',
            'grade exams',
            
            // Grades & Groups
            'view grades',
            'create grades',
            'edit grades',
            'delete grades',
            'view groups',
            'create groups',
            'edit groups',
            'delete groups',
            
       
           // Reports & Dashboard
            'view dashboard',
            'view reports',
            
            // Notifications
            'send notifications',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'secretary']);
        }
    }
}
