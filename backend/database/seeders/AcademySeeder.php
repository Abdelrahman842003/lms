<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Academy;
use App\Models\Secretary;
use App\Models\Teacher;
use App\Models\Student;
use Illuminate\Support\Facades\Hash;

class AcademySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🏢 Creating academies with demo data...');

        // Academy 1: أكاديمية النجاح التعليمية
        $secretary1 = Secretary::firstOrCreate(
            ['phone' => '01012345678'],
            [
                'name' => 'سكرتير الأكاديمية التجريبية',
                'password' => Hash::make('123456'),
                'is_active' => true,
            ]
        );


        $academy1 = Academy::updateOrCreate(
            ['phone' => '01012345678'],
            [
                'name' => 'أكاديمية النجاح التعليمية',
                'password' => Hash::make('123456'),
                'is_active' => true,
            ]
        );

        // Attach secretary to academy
        if (!$academy1->secretaries()->where('secretary_id', $secretary1->id)->exists()) {
            $academy1->secretaries()->attach($secretary1->id, [
                'permissions' => json_encode(['manage_teachers', 'view_reports', 'view_billing']),
                'is_active' => true,
            ]);
        }

        // Academy 2: أكاديمية الاختبار
        $secretary2 = Secretary::firstOrCreate(
            ['phone' => '01099999999'],
            [
                'name' => 'سكرتير أكاديمية الاختبار',
                'password' => Hash::make('123456'),
                'is_active' => true,
            ]
        );

        $academy2 = Academy::updateOrCreate(
            ['phone' => '01099999999'],
            [
                'name' => 'أكاديمية الاختبار',
                'password' => Hash::make('123456'),
                'is_active' => true,
            ]
        );

        if (!$academy2->secretaries()->where('secretary_id', $secretary2->id)->exists()) {
            $academy2->secretaries()->attach($secretary2->id, [
                'permissions' => json_encode(['manage_teachers', 'view_reports']),
                'is_active' => true,
            ]);
        }

        // Academy 3: أكاديمية المستقبل (Inactive)
        $secretary3 = Secretary::firstOrCreate(
            ['phone' => '01088888888'],
            [
                'name' => 'سكرتير أكاديمية المستقبل',
                'password' => Hash::make('123456'),
                'is_active' => true,
            ]
        );

        $academy3 = Academy::updateOrCreate(
            ['phone' => '01088888888'],
            [
                'name' => 'أكاديمية المستقبل',
                'password' => Hash::make('123456'),
                'is_active' => false, // Inactive academy for testing
            ]
        );

        if (!$academy3->secretaries()->where('secretary_id', $secretary3->id)->exists()) {
            $academy3->secretaries()->attach($secretary3->id, [
                'permissions' => json_encode(['view_reports']),
                'is_active' => true,
            ]);
        }

        $this->command->info('✅ Academies created successfully!');
        $this->command->info('');
        $this->command->info('📊 Summary:');
        $this->command->info('🏢 Academy 1: أكاديمية النجاح التعليمية (نشط)');
        $this->command->info('   📱 Phone: 01012345678');
        $this->command->info('   🔑 Password: 123456');
        $this->command->info('');
        $this->command->info('🏢 Academy 2: أكاديمية الاختبار (نشط)');
        $this->command->info('   📱 Phone: 01099999999');
        $this->command->info('   🔑 Password: 123456');
        $this->command->info('');
        $this->command->info('🏢 Academy 3: أكاديمية المستقبل (معطل)');
        $this->command->info('   📱 Phone: 01088888888');
        $this->command->info('   🔑 Password: 123456');
    }
}
