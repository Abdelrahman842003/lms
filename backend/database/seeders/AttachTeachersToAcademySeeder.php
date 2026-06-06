<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;

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
            // Attach to academy pivot table
            if (!$academy->teachers()->where('teacher_id', $teacher->id)->exists()) {
                $academy->teachers()->attach($teacher->id, [
                    'is_active' => true,
                    'joined_at' => now(),
                ]);
            }

            // Resolve profiles
            $independentProfile = \App\Domains\Auth\Models\TeacherProfile::firstOrCreate(
                ['teacher_id' => $teacher->id, 'type' => 'independent'],
                [
                    'display_name' => $teacher->name . ' - مستقل',
                    'slug' => \Illuminate\Support\Str::slug($teacher->name) . '-independent-' . substr($teacher->id, 0, 4),
                    'status' => 'ACTIVE',
                ]
            );

            $academyProfile = \App\Domains\Auth\Models\TeacherProfile::firstOrCreate(
                ['teacher_id' => $teacher->id, 'academy_id' => $academy->id, 'type' => 'academy'],
                [
                    'display_name' => $teacher->name . ' - ' . $academy->name,
                    'slug' => \Illuminate\Support\Str::slug($teacher->name) . '-' . \Illuminate\Support\Str::slug($academy->name) . '-' . substr($teacher->id, 0, 4),
                    'status' => 'ACTIVE',
                ]
            );

            // Copy GamificationSettings to Academy Profile if they don't exist
            $independentSettings = \App\Domains\Gamification\Models\GamificationSetting::where('teacher_profile_id', $independentProfile->id)->first();
            if ($independentSettings) {
                \App\Domains\Gamification\Models\GamificationSetting::firstOrCreate(
                    ['teacher_profile_id' => $academyProfile->id],
                    [
                        'attendance_points' => $independentSettings->attendance_points,
                        'perfect_month_bonus' => $independentSettings->perfect_month_bonus,
                        'exam_max_points' => $independentSettings->exam_max_points,
                        'exam_retake_bonus' => $independentSettings->exam_retake_bonus,
                        'exam_first_place_bonus' => $independentSettings->exam_first_place_bonus,
                        'streak_5_bonus' => $independentSettings->streak_5_bonus,
                        'streak_10_bonus' => $independentSettings->streak_10_bonus,
                        'is_enabled' => $independentSettings->is_enabled,
                        'show_leaderboard' => $independentSettings->show_leaderboard,
                        'leaderboard_size' => $independentSettings->leaderboard_size,
                    ]
                );
            }

            if ($teacher->phone === '01000000001') {
                // Hybrid Logic for Demo Teacher (Teacher 1)
                $this->command->info(" Creating Hybrid Data for Teacher 1 ({$teacher->phone})...");
                
                // 1. Academy Grades (1st & 2nd Secondary)
                $academyGrades = \App\Domains\Enrollments\Models\Grade::where('teacher_profile_id', $independentProfile->id)
                    ->whereIn('name', ['1st Secondary', '2nd Secondary'])->get();
                    
                foreach ($academyGrades as $grade) {
                    // Update Grade
                    $grade->update(['teacher_profile_id' => $academyProfile->id, 'academy_id' => $academy->id]);
                    
                    // Update Groups
                    \App\Domains\Enrollments\Models\Group::where('grade_id', $grade->id)
                        ->update(['teacher_profile_id' => $academyProfile->id, 'academy_id' => $academy->id]);
                        
                    // Update Enrollments
                    \App\Domains\Enrollments\Models\Enrollment::where('grade_id', $grade->id)
                        ->update(['teacher_profile_id' => $academyProfile->id, 'academy_id' => $academy->id]);
                        
                    // Update Lectures
                    \App\Domains\Lectures\Models\Lecture::where('grade_id', $grade->id)
                        ->update(['teacher_profile_id' => $academyProfile->id]);
                        
                    // Update Exams and Questions
                    $exams = \App\Domains\Exams\Models\Exam::where('grade_id', $grade->id)->get();
                    foreach ($exams as $exam) {
                        $exam->update(['teacher_profile_id' => $academyProfile->id]);
                        \App\Domains\Exams\Models\Question::where('exam_id', $exam->id)
                            ->update(['teacher_profile_id' => $academyProfile->id]);
                    }

                    // Update StudentPoints and PointTransactions for enrolled students
                    $studentIds = \App\Domains\Enrollments\Models\Enrollment::where('grade_id', $grade->id)->pluck('student_id');
                    \App\Domains\Gamification\Models\StudentPoint::whereIn('student_id', $studentIds)
                        ->where('teacher_profile_id', $independentProfile->id)
                        ->update(['teacher_profile_id' => $academyProfile->id]);

                    \App\Domains\Gamification\Models\PointTransaction::whereIn('student_id', $studentIds)
                        ->where('teacher_profile_id', $independentProfile->id)
                        ->update(['teacher_profile_id' => $academyProfile->id]);

                    // Update PaymentLogs
                    $enrollmentIds = \App\Domains\Enrollments\Models\Enrollment::where('grade_id', $grade->id)->pluck('id');
                    \App\Domains\Subscriptions\Models\PaymentLog::whereIn('enrollment_id', $enrollmentIds)
                        ->update(['teacher_profile_id' => $academyProfile->id]);
                }

                // 2. Independent Grades (3rd Secondary) - Ensure NULL academy_id
                $independentGrades = \App\Domains\Enrollments\Models\Grade::where('teacher_profile_id', $independentProfile->id)
                    ->where('name', '3rd Secondary')->get();
                    
                foreach ($independentGrades as $grade) {
                    $grade->update(['academy_id' => null]);
                    
                    \App\Domains\Enrollments\Models\Group::where('grade_id', $grade->id)
                        ->update(['academy_id' => null]);
                        
                    \App\Domains\Enrollments\Models\Enrollment::where('grade_id', $grade->id)
                        ->update(['academy_id' => null]);
                }
                
            } else {
                // Standard Logic for others (All Academy)
                $this->command->info(" Moving all data to Academy Profile for teacher ({$teacher->phone})...");

                // Update Grades
                \App\Domains\Enrollments\Models\Grade::where('teacher_profile_id', $independentProfile->id)
                    ->update(['teacher_profile_id' => $academyProfile->id, 'academy_id' => $academy->id]);
                    
                // Update Groups
                \App\Domains\Enrollments\Models\Group::where('teacher_profile_id', $independentProfile->id)
                    ->update(['teacher_profile_id' => $academyProfile->id, 'academy_id' => $academy->id]);

                // Update Enrollments
                \App\Domains\Enrollments\Models\Enrollment::where('teacher_profile_id', $independentProfile->id)
                    ->update(['teacher_profile_id' => $academyProfile->id, 'academy_id' => $academy->id]);

                // Update Lectures
                \App\Domains\Lectures\Models\Lecture::where('teacher_profile_id', $independentProfile->id)
                    ->update(['teacher_profile_id' => $academyProfile->id]);

                // Update Exams
                \App\Domains\Exams\Models\Exam::where('teacher_profile_id', $independentProfile->id)
                    ->update(['teacher_profile_id' => $academyProfile->id]);

                // Update Questions
                \App\Domains\Exams\Models\Question::where('teacher_profile_id', $independentProfile->id)
                    ->update(['teacher_profile_id' => $academyProfile->id]);

                // Update StudentPoints
                \App\Domains\Gamification\Models\StudentPoint::where('teacher_profile_id', $independentProfile->id)
                    ->update(['teacher_profile_id' => $academyProfile->id]);

                // Update PointTransactions
                \App\Domains\Gamification\Models\PointTransaction::where('teacher_profile_id', $independentProfile->id)
                    ->update(['teacher_profile_id' => $academyProfile->id]);

                // Update PaymentLogs
                $enrollmentIds = \App\Domains\Enrollments\Models\Enrollment::where('teacher_profile_id', $academyProfile->id)->pluck('id');
                \App\Domains\Subscriptions\Models\PaymentLog::whereIn('enrollment_id', $enrollmentIds)
                    ->update(['teacher_profile_id' => $academyProfile->id]);
            }
        }

        $this->command->info('Teachers attached successfully!');
        $this->command->info('Updated grades and groups with academy_id and resolved workspace profiles!');
    }
}
