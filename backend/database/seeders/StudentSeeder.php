<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $teachers = \App\Models\Teacher::all();

        foreach ($teachers as $teacher) {
            Student::factory(rand(5, 10))->create([
                'teacher_id' => $teacher->id,
            ]);
        }
    }
}
