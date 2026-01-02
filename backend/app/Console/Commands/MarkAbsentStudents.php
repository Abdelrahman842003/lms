<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Lecture;
use App\Models\Attendance;
use App\Notifications\StudentAbsentNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MarkAbsentStudents extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'lectures:mark-absent';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Mark students as absent for finished lectures and send notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to mark absent students...');

        // Find lectures that finished in the last hour
        // We add a buffer (e.g., 5 minutes after end_time) to ensure we don't mark them immediately if there's a slight delay
        // But for "finished in the last hour", we can look at end_time between now-1h and now.
        
        $now = Carbon::now();
        $oneHourAgo = $now->copy()->subHour();

        $finishedLectures = Lecture::whereBetween('end_time', [$oneHourAgo, $now])
            ->with(['teacher.activeStudents'])
            ->get();

        $this->info("Found {$finishedLectures->count()} finished lectures in the last hour.");

        foreach ($finishedLectures as $lecture) {
            $this->info("Processing lecture: {$lecture->title} (ID: {$lecture->id})");

            $teacher = $lecture->teacher;
            if (!$teacher) {
                continue;
            }

            // Get all active students for this teacher
            // Assuming lecture is for all active students. 
            // If lectures are grade-specific, we would need to filter students by grade here.
            // But based on current codebase, it seems to be all students.
            $students = $teacher->activeStudents;

            foreach ($students as $student) {
                // Check if attendance record exists
                $attendance = Attendance::where('lecture_id', $lecture->id)
                    ->where('student_id', $student->id)
                    ->first();

                if (!$attendance) {
                    // Create absent record
                    try {
                        DB::transaction(function () use ($lecture, $student, $teacher) {
                            Attendance::create([
                                'lecture_id' => $lecture->id,
                                'student_id' => $student->id,
                                'status' => 'absent',
                            ]);

                            // Send Notification
                            $student->notify(new StudentAbsentNotification($lecture->title, $teacher->name));

                            // Send Notification to Parent
                            if ($student->parent_phone) {
                                $guardian = \App\Models\Guardian::where('phone', $student->parent_phone)->first();
                                if ($guardian) {
                                    $guardian->notify(new \App\Notifications\ParentNotification(
                                        $guardian->id,
                                        'تسجيل غياب',
                                        "لقد تم تسجيل الطالب {$student->name} غائب في محاضرة: {$lecture->title} للمدرس {$teacher->name}",
                                        $teacher->name,
                                        $student->name,
                                        'absent'
                                    ));
                                }
                            }
                        });
                        
                        $this->info("Marked student {$student->name} as absent.");
                    } catch (\Exception $e) {
                        $this->error("Failed to mark student {$student->name} as absent: " . $e->getMessage());
                    }
                }
            }
        }

        $this->info('Finished marking absent students.');
    }
}
