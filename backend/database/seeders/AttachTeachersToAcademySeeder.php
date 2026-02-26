<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Academy;
use App\Models\Teacher;

class AttachTeachersToAcademySeeder extends Seeder
{
    public function run(): void
    {
        $academy = Academy::first();

        if (!$academy) {
            $this->command->error('No academy found. Please run AcademySeeder first.');
            return;
        }

        $teachers = Teacher::all();

        if ($teachers->isEmpty()) {
            $this->command->error('No teachers found. Please run CompleteSeeder first.');
            return;
        }

        $this->command->info("Attaching {$teachers->count()} teachers to academy: {$academy->name}");

        foreach ($teachers as $teacher) {
            // Attach to academy
            if (!$academy->teachers()->where('teacher_id', $teacher->id)->exists()) {
                $academy->teachers()->attach($teacher->id, [
                    'is_active' => true,
                    'joined_at' => now(),
                ]);
            }

            if ($teacher->phone === '01000000001') {
                // Hybrid Logic for Demo Teacher (Teacher 1)
                $this->command->info(" Creating Hybrid Data for Teacher 1 ({$teacher->phone})...");
                
                // 1. Academy Grades (1st & 2nd Secondary)
                $academyGrades = \App\Domains\Enrollments\Models\Grade::where('teacher_id', $teacher->id)
                    ->whereIn('name', ['1st Secondary', '2nd Secondary'])->get();
                    
                foreach ($academyGrades as $grade) {
                    $grade->update(['academy_id' => $academy->id]);
                    $grade->groups()->update(['academy_id' => $academy->id]);
                    $grade->enrollments()->update(['academy_id' => $academy->id]);
                }

                // 2. Independent Grades (3rd Secondary) - Ensure NULL
                $independentGrades = \App\Domains\Enrollments\Models\Grade::where('teacher_id', $teacher->id)
                    ->where('name', '3rd Secondary')->get();
                    
                foreach ($independentGrades as $grade) {
                    $grade->update(['academy_id' => null]);
                    $grade->groups()->update(['academy_id' => null]);
                    $grade->enrollments()->update(['academy_id' => null]);
                }
                
            } else {
                // Standard Logic for others (All Academy)
                \App\Domains\Enrollments\Models\Grade::where('teacher_id', $teacher->id)
                    ->update(['academy_id' => $academy->id]);
                    
                \App\Domains\Enrollments\Models\Group::where('teacher_id', $teacher->id)
                    ->update(['academy_id' => $academy->id]);

                \App\Domains\Enrollments\Models\Enrollment::where('teacher_id', $teacher->id)
                    ->update(['academy_id' => $academy->id]);
            }
        }

        $this->command->info('Teachers attached successfully!');
        $this->command->info('Updated grades and groups with academy_id!');
    }
}
