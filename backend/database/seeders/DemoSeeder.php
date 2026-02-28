<?php

namespace Database\Seeders;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Secretary;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // Create Demo Teacher
        $teacher = Teacher::firstOrCreate(
            ['phone' => '01000000000'],
            [
                'name' => 'Demo Teacher',
                'password' => Hash::make('password'),
                'status' => 'active',
            ]
        );

        // Create Demo Student
        Student::firstOrCreate(
            ['phone' => '01100000000'],
            [
                'name' => 'Demo Student',
                'password' => Hash::make('password'),
            ]
        );

        // Create Demo Secretary
        Secretary::firstOrCreate(
            ['phone' => '01200000000'],
            [
                'name' => 'Demo Secretary',
                'password' => Hash::make('password'),
                'teacher_id' => $teacher->id,
            ]
        );
    }
}
