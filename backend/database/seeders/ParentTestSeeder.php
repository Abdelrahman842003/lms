<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ParentTestSeeder extends Seeder
{
    public function run(): void
    {
        $parentPhone = '01012345601';
        $password = Hash::make('password');

        for ($i = 1; $i <= 5; $i++) {
            // Ensure unique phone numbers
            $studentPhone = '015' . str_pad($i, 8, '0', STR_PAD_LEFT);
            
            Student::create([
                'name' => "ابن تجريبي $i",
                'phone' => $studentPhone,
                'parent_phone' => $parentPhone,
                'password' => $password,
                'gender' => $i % 2 == 0 ? 'female' : 'male',
                'education_type' => 'general',
                'location' => 'Cairo',
            ]);
        }
        
        $this->command->info("Created 5 students for parent: $parentPhone");
    }
}
