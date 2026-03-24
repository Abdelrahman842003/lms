<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Academy;
use App\Models\Teacher;
use App\Domains\Application\Models\TeacherAttendanceLog;
use Carbon\Carbon;

class AttendanceTestDataSeeder extends Seeder
{
    public function run(): void
    {
        $academy = Academy::first();
        
        if (!$academy) {
            $this->command->info('No academy found. Skipping attendance seeding.');
            return;
        }

        $teachers = $academy->teachers;

        if ($teachers->isEmpty()) {
            $this->command->info('No teachers found in academy. Skipping attendance seeding.');
            return;
        }

        $this->command->info('Seeding attendance data for academy: ' . $academy->name);

        // Seed for today
        $today = Carbon::today();
        foreach ($teachers as $index => $teacher) {
            // Teacher 1: Checked out (completed day)
            if ($index === 0) {
                TeacherAttendanceLog::create([
                    'academy_id' => $academy->id,
                    'teacher_id' => $teacher->id,
                    'date' => $today,
                    'checked_in_at' => $today->copy()->setHour(8)->setMinute(0),
                    'checked_out_at' => $today->copy()->setHour(14)->setMinute(30),
                    'status' => 'checked_out',
                    'notes' => 'حضور منتظم',
                ]);
            }
            // Teacher 2: Checked in (currently present)
            elseif ($index === 1) {
                TeacherAttendanceLog::create([
                    'academy_id' => $academy->id,
                    'teacher_id' => $teacher->id,
                    'date' => $today,
                    'checked_in_at' => $today->copy()->setHour(9)->setMinute(15),
                    'checked_out_at' => null,
                    'status' => 'checked_in',
                    'notes' => null,
                ]);
            }
            // Teacher 3: Absent (no record or marked absent)
            // We'll create an absent record if the system supports it, or just leave it empty.
            // Based on model, status can be 'absent'.
            elseif ($index === 2) {
                TeacherAttendanceLog::create([
                    'academy_id' => $academy->id,
                    'teacher_id' => $teacher->id,
                    'date' => $today,
                    'checked_in_at' => null,
                    'checked_out_at' => null,
                    'status' => 'absent',
                    'notes' => 'غياب بعذر',
                ]);
            }
        }

        // Seed for past 5 days
        for ($i = 1; $i <= 5; $i++) {
            $date = Carbon::today()->subDays($i);
            foreach ($teachers as $teacher) {
                // Randomly assign attendance
                $status = rand(0, 10) > 2 ? 'checked_out' : 'absent';
                
                if ($status === 'checked_out') {
                    TeacherAttendanceLog::create([
                        'academy_id' => $academy->id,
                        'teacher_id' => $teacher->id,
                        'date' => $date,
                        'checked_in_at' => $date->copy()->setHour(8 + rand(0, 1))->setMinute(rand(0, 59)),
                        'checked_out_at' => $date->copy()->setHour(14 + rand(0, 2))->setMinute(rand(0, 59)),
                        'status' => 'checked_out',
                        'notes' => null,
                    ]);
                } else {
                    TeacherAttendanceLog::create([
                        'academy_id' => $academy->id,
                        'teacher_id' => $teacher->id,
                        'date' => $date,
                        'checked_in_at' => null,
                        'checked_out_at' => null,
                        'status' => 'absent',
                        'notes' => 'غياب',
                    ]);
                }
            }
        }

        $this->command->info('Attendance data seeded successfully.');
    }
}
