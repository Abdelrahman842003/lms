<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Find duplicate students by phone
        $duplicates = DB::table('students')
            ->select('phone', DB::raw('COUNT(*) as count'))
            ->whereNotNull('phone')
            ->groupBy('phone')
            ->having('count', '>', 1)
            ->get();

        $mergedStudents = [];

        foreach ($duplicates as $dup) {
            $students = DB::table('students')
                ->where('phone', $dup->phone)
                ->orderBy('created_at', 'asc')
                ->get();

            if ($students->isEmpty()) continue;

            $primary = $students->first();
            $duplicateIds = $students->skip(1)->pluck('id')->toArray();

            // Log the merge
            Log::info("Merging students with phone {$dup->phone}", [
                'primary_id' => $primary->id,
                'merged_ids' => $duplicateIds
            ]);

            // Move all relations to primary student
            foreach ($duplicateIds as $duplicateId) {
                // Move attendances
                DB::table('attendances')
                    ->where('student_id', $duplicateId)
                    ->update(['student_id' => $primary->id]);

                // Move exam results
                DB::table('exam_results')
                    ->where('student_id', $duplicateId)
                    ->update(['student_id' => $primary->id]);

                // Delete the duplicate student
                DB::table('students')->where('id', $duplicateId)->delete();
            }

            $mergedStudents[] = [
                'primary_id' => $primary->id,
                'merged_ids' => $duplicateIds,
                'phone' => $dup->phone
            ];
        }

        // Step 2: Create enrollments from existing students (only those with teacher_id)
        $students = DB::table('students')
            ->whereNotNull('teacher_id')
            ->get();

        $skippedCount = DB::table('students')->whereNull('teacher_id')->count();
        if ($skippedCount > 0) {
            Log::warning("Skipped {$skippedCount} students with null teacher_id");
        }

        foreach ($students as $student) {
            // Create enrollment record
            DB::table('enrollments')->insert([
                'id' => Str::uuid()->toString(),
                'student_id' => $student->id,
                'teacher_id' => $student->teacher_id,
                'grade_id' => $student->grade_id,
                'group_id' => $student->group_id,
                'balance' => $student->balance ?? 0,
                'is_active' => $student->is_active ?? true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Log the enrollment creation
            DB::table('student_activity_logs')->insert([
                'id' => Str::uuid()->toString(),
                'student_id' => $student->id,
                'enrollment_id' => null, // Will be null for migration
                'action' => 'enrolled',
                'data' => json_encode([
                    'source' => 'data_migration',
                    'teacher_id' => $student->teacher_id
                ]),
                'performed_by_type' => 'System',
                'performed_by_id' => null,
                'created_at' => now(),
            ]);
        }

        // Step 3: Log merged students
        foreach ($mergedStudents as $merge) {
            DB::table('student_activity_logs')->insert([
                'id' => Str::uuid()->toString(),
                'student_id' => $merge['primary_id'],
                'enrollment_id' => null,
                'action' => 'merged',
                'data' => json_encode([
                    'merged_ids' => $merge['merged_ids'],
                    'phone' => $merge['phone'],
                    'source' => 'data_migration'
                ]),
                'performed_by_type' => 'System',
                'performed_by_id' => null,
                'created_at' => now(),
            ]);
        }

        Log::info("Data migration completed", [
            'total_students_migrated' => $students->count(),
            'total_merges' => count($mergedStudents)
        ]);
    }

    public function down(): void
    {
        // This migration cannot be cleanly reversed
        // The enrollments will be dropped when the enrollments table is dropped
        // The merged students cannot be un-merged automatically
        Log::warning("Data migration down() called - merged students cannot be automatically restored");
    }
};
