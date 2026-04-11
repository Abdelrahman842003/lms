<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class StudentAndSecretaryPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Wipe ALL existing permissions for student and secretary guards to start fresh
        Permission::whereIn('guard_name', ['student', 'secretary'])->delete();

        // 2. The ONLY Secretary Permissions allowed (Exact naming as requested)
        $secretaryPermissions = [
            'الطلاب',
            'المجموعات',
            'الصفوف الدراسية',
            'المحاضرات',
            'الفيديوهات التعليمية',
            'الامتحانات',
            'التقارير',
            'الاختبارات',
            'لوحة الشرف',
            'الحضور والانصراف',
        ];

        foreach ($secretaryPermissions as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'secretary']);
        }
    }
}
