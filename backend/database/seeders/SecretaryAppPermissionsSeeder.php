<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\DB;

class SecretaryAppPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. إعادة تعيين الكاش الخاص بالصلاحيات
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. حذف جميع الصلاحيات الحالية الخاصة بالسكرتير لضمان نظافة البيانات
        // نستخدم DB::table لتجنب أي مشاكل مع الـ Models أو الـ Events أثناء الحذف الجماعي
        DB::table('permissions')->where('guard_name', 'secretary')->delete();

        $this->command->warn('تم حذف كافة صلاحيات السكرتير القديمة بنجاح.');

        // 3. القائمة الكاملة والنهائية للصلاحيات
        $secretaryPermissions = [
            'dashboard'         => 'لوحة التحكم',
            'students'          => 'الطلاب',
            'secretaries'       => 'السكرتيرات',
            'groups'            => 'المجموعات',
            'grades'            => 'الصفوف الدراسية',
            'lectures'          => 'المحاضرات',
            'videos'            => 'الفيديوهات التعليمية',
            'exams'             => 'الامتحانات',
            'reports'           => 'التقارير',
            'attendance'        => 'الحضور والانصراف',
            'honor_roll'        => 'لوحة الشرف',
            'courses'           => 'الكورسات',
            'levels'            => 'المستويات',
            'lessons'           => 'الدروس',
            'stats'             => 'عرض الإحصائيات',
            'notifications'     => 'الإخطارات',
        ];

        foreach ($secretaryPermissions as $key => $name) {
            Permission::create([
                'name' => $name,
                'feature_key' => $key,
                'guard_name' => 'secretary'
            ]);
        }

        $this->command->info('تم إعادة بناء صلاحيات السكرتير من الصفر بنجاح.');
    }
}
