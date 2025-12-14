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

        // Cleanup English permissions if they exist
        $englishPermissions = [
            'view_lectures', 'view_exams', 'take_exams', 'view_grades', 'view_assignments', 'submit_assignments',
            'manage_students', 'manage_lectures', 'manage_exams', 'manage_attendance', 'view_reports', 'manage_payments'
        ];
        Permission::whereIn('name', $englishPermissions)->delete();

        // Student Permissions (Arabic)
        $studentPermissions = [
            'مشاهدة المحاضرات',
            'مشاهدة الامتحانات',
            'أداء الامتحانات',
            'مشاهدة الدرجات',
            'مشاهدة الواجبات',
            'تسليم الواجبات',
        ];

        foreach ($studentPermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'student']);
        }

        // Secretary Permissions (Arabic)
        $secretaryPermissions = [
            'إدارة الطلاب',
            'إدارة المحاضرات',
            'إدارة الامتحانات',
            'إدارة الحضور',
            'مشاهدة التقارير',
            'إدارة المدفوعات',
        ];

        foreach ($secretaryPermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'secretary']);
        }
    }
}
