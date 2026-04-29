<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\Student;
use App\Domains\Enrollments\Models\Enrollment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class TestAccountsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $password = 'password';

        // 1. Super Admin
        $admin = Admin::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make($password),
            ]
        );
        $admin->assignRole('Super Admin');
        $this->command->info('Test Admin created: admin / password');

        // 2. Academy
        $academy = Academy::firstOrCreate(
            ['phone' => '01000000001'],
            [
                'name' => 'Najah Academy',
                'password' => Hash::make($password),
                'is_active' => true,
                'status' => 'active',
                'max_enrollments_limit' => 1000,
            ]
        );
        $this->command->info('Test Academy created: 01000000001 / password');

        // 3. Teacher
        $teacher = Teacher::firstOrCreate(
            ['phone' => '01000000002'],
            [
                'name' => 'Ahmed Teacher',
                'subject' => 'اللغة العربية',
                'password' => Hash::make($password),
                'status' => 'active',
                'is_independent_active' => true,
            ]
        );
        
        // Link Teacher to Academy
        $academy->teachers()->syncWithoutDetaching([$teacher->id => ['is_active' => true, 'joined_at' => now()]]);
        $this->command->info('Test Teacher created: 01000000002 / password (Linked to Najah Academy)');

        // 4. Academy Secretary
        $academySecretary = Secretary::firstOrCreate(
            ['phone' => '01000000003'],
            [
                'name' => 'Academy Secretary',
                'password' => Hash::make($password),
                'is_active' => true,
            ]
        );
        $academySecretary->assignRole('Academy Secretary');
        $academySecretary->academies()->syncWithoutDetaching([$academy->id => ['is_active' => true]]);
        $this->command->info('Test Academy Secretary created: 01000000003 / password');

        // 5. Teacher Secretary
        $teacherSecretary = Secretary::firstOrCreate(
            ['phone' => '01000000004'],
            [
                'name' => 'Teacher Secretary',
                'password' => Hash::make($password),
                'is_active' => true,
            ]
        );
        $teacherSecretary->assignRole('Teacher Secretary');
        $teacherSecretary->teachers()->syncWithoutDetaching([$teacher->id]);
        $this->command->info('Test Teacher Secretary created: 01000000004 / password');

        // 6. Guardian (Parent)
        $parent = Guardian::firstOrCreate(
            ['phone' => '01000000005'],
            [
                'name' => 'Mohamed Parent',
                'password' => Hash::make($password),
            ]
        );
        $this->command->info('Test Parent created: 01000000005 / password');

        // 7. Student
        $student = Student::firstOrCreate(
            ['phone' => '01000000006'],
            [
                'name' => 'Yassin Student',
                'password' => Hash::make($password),
                'gender' => \App\Domains\Auth\Enums\StudentGender::MALE,
                'education_type' => \App\Domains\Auth\Enums\StudentEducationType::NATIONAL,
                'is_active' => true,
                'teacher_id' => $teacher->id,
                'guardian_id' => $parent->id,
            ]
        );
        
        // Create Enrollment
        Enrollment::updateOrCreate(
            [
                'student_id' => $student->id,
                'teacher_id' => $teacher->id,
                'academy_id' => $academy->id,
            ],
            [
                'is_active' => true,
                'subscription_start' => now(),
            ]
        );
        
        $this->command->info('Test Student created: 01000000006 / password (Linked to Parent & Teacher & Academy)');
    }
}
