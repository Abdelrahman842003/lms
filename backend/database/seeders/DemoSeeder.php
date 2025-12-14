<?php

namespace Database\Seeders;

use App\Models\Teacher;
use App\Models\Student;
use App\Models\Secretary;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // Create Demo Teacher
        $teacher = Teacher::firstOrCreate(
            ['username' => 'teacher'],
            [
                'name' => 'Demo Teacher',
                'password' => Hash::make('password'),
            ]
        );

        // Create Demo Student
        Student::firstOrCreate(
            ['username' => 'student'],
            [
                'name' => 'Demo Student',
                'password' => Hash::make('password'),
                'teacher_id' => $teacher->id,
            ]
        );

        // Create Demo Secretary
        Secretary::firstOrCreate(
            ['username' => 'secretary'],
            [
                'name' => 'Demo Secretary',
                'password' => Hash::make('password'),
                'teacher_id' => $teacher->id,
            ]
        );
    }
}
