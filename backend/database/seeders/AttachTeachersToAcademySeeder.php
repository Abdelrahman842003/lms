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
            if (!$academy->teachers()->where('teacher_id', $teacher->id)->exists()) {
                $academy->teachers()->attach($teacher->id, [
                    'is_active' => true,
                    'joined_at' => now(),
                ]);
            }
            
            // Update academy_id in grades and groups for this teacher
            \App\Models\Grade::where('teacher_id', $teacher->id)
                ->whereNull('academy_id')
                ->update(['academy_id' => $academy->id]);
                
            \App\Models\Group::where('teacher_id', $teacher->id)
                ->whereNull('academy_id')
                ->update(['academy_id' => $academy->id]);
        }

        $this->command->info('Teachers attached successfully!');
        $this->command->info('Updated grades and groups with academy_id!');
    }
}
