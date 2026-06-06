<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Disable foreign key constraints during alter to prevent sequence issues
        Schema::disableForeignKeyConstraints();

        $tables = [
            'enrollments', 'grades', 'groups', 'lectures', 'exams', 'questions', 
            'sent_notifications', 'notes', 'student_points', 'point_transactions', 
            'gamification_settings', 'student_failed_questions', 'payment_logs', 
            'secretaries', 'secretary_teacher', 'video_access_grants', 'videos'
        ];

        // 1. First, create teacher_profile_id columns as nullable
        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $tableGroup) {
                $tableGroup->unsignedBigInteger('teacher_profile_id')->nullable();
            });
        }

        // 2. Populate teacher_profiles table from existing data
        $teachers = DB::table('teachers')->get();
        foreach ($teachers as $teacher) {
            // A. Independent Profile (active or fallback)
            $independentSlug = Str::slug($teacher->name) . '-independent-' . substr($teacher->id, 0, 4);
            
            $independentProfileId = DB::table('teacher_profiles')->insertGetId([
                'uuid' => (string) Str::uuid(),
                'teacher_id' => $teacher->id,
                'academy_id' => null,
                'type' => 'independent',
                'display_name' => $teacher->name . ' - مستقل',
                'slug' => $independentSlug,
                'status' => 'ACTIVE',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // B. Academy Profiles (from academy_teacher pivot)
            $academyRelations = DB::table('academy_teacher')->where('teacher_id', $teacher->id)->get();
            $academyProfileIds = [];
            foreach ($academyRelations as $relation) {
                $academy = DB::table('academies')->where('id', $relation->academy_id)->first();
                if ($academy) {
                    $academySlug = Str::slug($teacher->name) . '-' . Str::slug($academy->name) . '-' . substr($relation->academy_id, 0, 4);
                    
                    $profileId = DB::table('teacher_profiles')->insertGetId([
                        'uuid' => (string) Str::uuid(),
                        'teacher_id' => $teacher->id,
                        'academy_id' => $relation->academy_id,
                        'type' => 'academy',
                        'display_name' => $teacher->name . ' - ' . $academy->name,
                        'slug' => $academySlug,
                        'status' => $relation->is_active ? 'ACTIVE' : 'INACTIVE',
                        'created_at' => $relation->joined_at ?? now(),
                        'updated_at' => now(),
                    ]);
                    $academyProfileIds[$relation->academy_id] = $profileId;
                }
            }

            // 3. Map existing data to profiles for this teacher
            // For tables that have academy_id
            $tablesWithAcademyId = ['enrollments', 'grades', 'groups', 'lectures', 'exams', 'notes', 'videos'];
            foreach ($tablesWithAcademyId as $table) {
                $teacherCol = ($table === 'videos') ? 'teacher_reference_id' : 'teacher_id';
                
                $records = DB::table($table)->where($teacherCol, $teacher->id)->get();
                foreach ($records as $record) {
                    $profileId = $independentProfileId;
                    if (isset($record->academy_id) && $record->academy_id && isset($academyProfileIds[$record->academy_id])) {
                        $profileId = $academyProfileIds[$record->academy_id];
                    }
                    DB::table($table)->where('id', $record->id)->update(['teacher_profile_id' => $profileId]);
                }
            }

            // For tables that DO NOT have academy_id
            $tablesWithoutAcademyId = [
                'questions', 'sent_notifications', 'student_points', 'point_transactions', 
                'gamification_settings', 'student_failed_questions', 'payment_logs', 
                'secretaries', 'secretary_teacher', 'video_access_grants'
            ];
            foreach ($tablesWithoutAcademyId as $table) {
                $teacherCol = ($table === 'secretary_teacher') ? 'teacher_id' : 'teacher_id';
                DB::table($table)->where($teacherCol, $teacher->id)->update(['teacher_profile_id' => $independentProfileId]);
            }
        }

        // 4. Now drop old columns and apply constraints
        
        // 1. enrollments
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropUnique('enrollment_context_unique');
            $table->dropIndex('enrollments_teacher_active_index');
            $table->dropIndex('idx_enrollments_lookup');
            $table->dropIndex('enrollments_academy_teacher_active_index');
            $table->dropIndex('enrollments_teacher_id_index');
        });
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
            $table->unique(['student_id', 'teacher_profile_id'], 'student_profile_unique');
            $table->index(['teacher_profile_id', 'is_active'], 'enrollments_profile_active_index');
            $table->index(['teacher_profile_id', 'grade_id', 'is_active'], 'idx_enrollments_profile_lookup');
        });

        // 2. grades
        Schema::table('grades', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('grades', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
        });

        // 3. groups
        Schema::table('groups', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
        });

        // 4. lectures
        Schema::table('lectures', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('lectures', function (Blueprint $table) {
            $table->dropIndex('lectures_teacher_active_index');
            $table->dropIndex('idx_lectures_teacher_date');
            $table->dropIndex('lectures_teacher_start_time_index');
        });
        Schema::table('lectures', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
            $table->index(['teacher_profile_id', 'is_active'], 'lectures_profile_active_index');
            $table->index(['teacher_profile_id', 'start_time', 'is_active'], 'idx_lectures_profile_date');
            $table->index(['teacher_profile_id', 'start_time'], 'lectures_profile_start_time_index');
        });

        // 5. exams
        Schema::table('exams', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('exams', function (Blueprint $table) {
            $table->dropIndex('exams_teacher_active_index');
            $table->dropIndex('exams_teacher_is_active_index');
        });
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
            $table->index(['teacher_profile_id', 'is_active'], 'exams_profile_active_index');
        });

        // 6. questions
        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
            // Polymorphic ownership columns
            $table->string('owner_type', 64)->nullable();
            $table->uuid('owner_id')->nullable();
            $table->index(['owner_type', 'owner_id']);
        });

        // 7. sent_notifications
        Schema::table('sent_notifications', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('sent_notifications', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
        });

        // 8. notes
        Schema::table('notes', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex('notes_teacher_id_is_active_index');
        });
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
            // Polymorphic ownership columns
            $table->string('owner_type', 64)->nullable();
            $table->uuid('owner_id')->nullable();
            $table->index(['owner_type', 'owner_id']);
            $table->index(['teacher_profile_id', 'is_active'], 'notes_profile_is_active_index');
        });

        // 9. student_points
        Schema::table('student_points', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('student_points', function (Blueprint $table) {
            // Add the new unique key first to satisfy foreign key constraint on student_id
            $table->unique(['student_id', 'teacher_profile_id'], 'student_profile_points_unique');
        });
        Schema::table('student_points', function (Blueprint $table) {
            $table->dropUnique('student_points_student_id_teacher_id_unique');
            $table->dropIndex('student_points_teacher_id_total_points_index');
        });
        Schema::table('student_points', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
            $table->index(['teacher_profile_id', 'total_points'], 'student_points_profile_total_points_index');
        });

        // 10. point_transactions
        Schema::table('point_transactions', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('point_transactions', function (Blueprint $table) {
            // Add student_profile index first to keep student_id indexed for foreign key constraint
            $table->index(['student_id', 'teacher_profile_id'], 'point_transactions_student_profile_index');
        });
        Schema::table('point_transactions', function (Blueprint $table) {
            $table->dropIndex('point_transactions_student_id_teacher_id_index');
            $table->dropIndex('idx_point_transactions_teacher_created');
            $table->dropIndex('idx_point_transactions_student_teacher');
            $table->dropUnique('unique_point_transaction');
        });
        Schema::table('point_transactions', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
            $table->index(['teacher_profile_id', 'created_at'], 'idx_point_transactions_profile_created');
            $table->index(['student_id', 'teacher_profile_id'], 'idx_point_transactions_student_profile');
            $table->unique(['student_id', 'teacher_profile_id', 'type', 'reference_type', 'reference_id'], 'unique_profile_point_transaction');
        });

        // 11. gamification_settings
        Schema::table('gamification_settings', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('gamification_settings', function (Blueprint $table) {
            $table->dropUnique('gamification_settings_teacher_id_unique');
        });
        Schema::table('gamification_settings', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
            $table->unique('teacher_profile_id');
        });

        // 12. student_failed_questions
        Schema::table('student_failed_questions', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('student_failed_questions', function (Blueprint $table) {
            $table->dropIndex('student_failed_questions_student_id_teacher_id_is_mastered_index');
        });
        Schema::table('student_failed_questions', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
            $table->index(['student_id', 'teacher_profile_id', 'is_mastered'], 'student_failed_questions_student_profile_is_mastered_index');
        });

        // 13. payment_logs
        Schema::table('payment_logs', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('payment_logs', function (Blueprint $table) {
            $table->dropIndex('payment_logs_teacher_id_status_index');
            $table->dropIndex('idx_payment_logs_confirmed');
            $table->dropIndex('idx_payment_logs_student');
            $table->dropIndex('payment_logs_teacher_status_date_index');
        });
        Schema::table('payment_logs', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
            $table->index(['teacher_profile_id', 'status'], 'payment_logs_profile_status_index');
            $table->index(['teacher_profile_id', 'status', 'confirmed_at'], 'idx_payment_logs_profile_confirmed');
            $table->index(['student_id', 'teacher_profile_id', 'status'], 'idx_payment_logs_profile_student');
            $table->index(['teacher_profile_id', 'status', 'confirmed_at'], 'payment_logs_profile_status_date_index');
        });

        // 14. secretaries
        Schema::table('secretaries', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('secretaries', function (Blueprint $table) {
            $table->dropIndex('secretaries_teacher_id_index');
        });
        Schema::table('secretaries', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
        });

        // 15. secretary_teacher
        Schema::table('secretary_teacher', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('secretary_teacher', function (Blueprint $table) {
            // Add the new unique key first to satisfy foreign key constraint on secretary_id
            $table->unique(['secretary_id', 'teacher_profile_id'], 'secretary_profile_unique');
        });
        Schema::table('secretary_teacher', function (Blueprint $table) {
            $table->dropUnique('secretary_teacher_secretary_id_teacher_id_unique');
        });
        Schema::table('secretary_teacher', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
        });

        // 16. video_access_grants
        Schema::table('video_access_grants', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
        });
        Schema::table('video_access_grants', function (Blueprint $table) {
            $table->dropColumn('teacher_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
        });

        // 17. videos
        Schema::table('videos', function (Blueprint $table) {
            $table->dropForeign(['teacher_reference_id']);
        });
        Schema::table('videos', function (Blueprint $table) {
            $table->dropIndex('videos_teacher_reference_id_status_index');
        });
        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn('teacher_reference_id');
            $table->foreign('teacher_profile_id')->references('id')->on('teacher_profiles')->onDelete('cascade');
            $table->index(['teacher_profile_id', 'status'], 'videos_profile_status_index');
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();

        // 1. enrollments
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropUnique('student_profile_unique');
            $table->dropIndex('enrollments_profile_active_index');
            $table->dropIndex('idx_enrollments_profile_lookup');
        });
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->onDelete('cascade');
            $table->unique(['student_id', 'teacher_id', 'academy_id'], 'enrollment_context_unique');
            $table->index(['teacher_id', 'is_active'], 'enrollments_teacher_active_index');
            $table->index(['teacher_id', 'grade_id', 'is_active'], 'idx_enrollments_lookup');
            $table->index(['academy_id', 'teacher_id', 'is_active'], 'enrollments_academy_teacher_active_index');
            $table->index('teacher_id', 'enrollments_teacher_id_index');
        });

        // 2. grades
        Schema::table('grades', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('grades', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->onDelete('cascade');
        });

        // 3. groups
        Schema::table('groups', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->onDelete('cascade');
        });

        // 4. lectures
        Schema::table('lectures', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('lectures', function (Blueprint $table) {
            $table->dropIndex('lectures_profile_active_index');
            $table->dropIndex('idx_lectures_profile_date');
            $table->dropIndex('lectures_profile_start_time_index');
        });
        Schema::table('lectures', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->onDelete('cascade');
            $table->index(['teacher_id', 'is_active'], 'lectures_teacher_active_index');
            $table->index(['teacher_id', 'start_time', 'is_active'], 'idx_lectures_teacher_date');
            $table->index(['teacher_id', 'start_time'], 'lectures_teacher_start_time_index');
        });

        // 5. exams
        Schema::table('exams', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('exams', function (Blueprint $table) {
            $table->dropIndex('exams_profile_active_index');
        });
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->onDelete('cascade');
            $table->index(['teacher_id', 'is_active'], 'exams_teacher_active_index');
            $table->index(['teacher_id', 'is_active'], 'exams_teacher_is_active_index');
        });

        // 6. questions
        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('questions', function (Blueprint $table) {
            $table->dropIndex(['owner_type', 'owner_id']);
        });
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn(['teacher_profile_id', 'owner_type', 'owner_id']);
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->cascadeOnDelete();
        });

        // 7. sent_notifications
        Schema::table('sent_notifications', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('sent_notifications', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->onDelete('cascade');
        });

        // 8. notes
        Schema::table('notes', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex('notes_profile_is_active_index');
            $table->dropIndex(['owner_type', 'owner_id']);
        });
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn(['teacher_profile_id', 'owner_type', 'owner_id']);
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->cascadeOnDelete();
            $table->index(['teacher_id', 'is_active']);
        });

        // 9. student_points
        Schema::table('student_points', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('student_points', function (Blueprint $table) {
            $table->dropUnique('student_profile_points_unique');
            $table->dropIndex('student_points_profile_total_points_index');
        });
        Schema::table('student_points', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->cascadeOnDelete();
            $table->unique(['student_id', 'teacher_id']);
            $table->index(['teacher_id', 'total_points']);
        });

        // 10. point_transactions
        Schema::table('point_transactions', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('point_transactions', function (Blueprint $table) {
            // Re-create one of the student_id indexes first to satisfy student_id foreign key constraint in down()
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->cascadeOnDelete();
        });
        Schema::table('point_transactions', function (Blueprint $table) {
            $table->index(['student_id', 'teacher_id']);
        });
        Schema::table('point_transactions', function (Blueprint $table) {
            $table->dropUnique('unique_profile_point_transaction');
            $table->dropIndex('point_transactions_student_profile_index');
            $table->dropIndex('idx_point_transactions_profile_created');
            $table->dropIndex('idx_point_transactions_student_profile');
        });
        Schema::table('point_transactions', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            // Re-create the remaining original indexes
            $table->index(['teacher_id', 'created_at'], 'idx_point_transactions_teacher_created');
            $table->index(['student_id', 'teacher_id'], 'idx_point_transactions_student_teacher');
            $table->unique(['student_id', 'teacher_id', 'type', 'reference_type', 'reference_id'], 'unique_point_transaction');
        });

        // 11. gamification_settings
        Schema::table('gamification_settings', function (Blueprint $table) {
            $table->dropUnique(['teacher_profile_id']);
            $table->dropForeign(['teacher_profile_id']);
        });

        Schema::table('gamification_settings', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_id')->nullable()->unique()->constrained('teachers')->cascadeOnDelete();
        });

        // 12. student_failed_questions
        Schema::table('student_failed_questions', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('student_failed_questions', function (Blueprint $table) {
            $table->dropIndex('student_failed_questions_student_profile_is_mastered_index');
        });
        Schema::table('student_failed_questions', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->cascadeOnDelete();
            $table->index(['student_id', 'teacher_id', 'is_mastered']);
        });

        // 13. payment_logs
        Schema::table('payment_logs', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('payment_logs', function (Blueprint $table) {
            $table->dropIndex('payment_logs_profile_status_index');
            $table->dropIndex('idx_payment_logs_profile_confirmed');
            $table->dropIndex('idx_payment_logs_profile_student');
            $table->dropIndex('payment_logs_profile_status_date_index');
        });
        Schema::table('payment_logs', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->onDelete('cascade');
            $table->index(['teacher_id', 'status']);
            $table->index(['teacher_id', 'status', 'confirmed_at'], 'idx_payment_logs_confirmed');
            $table->index(['student_id', 'teacher_id', 'status'], 'idx_payment_logs_student');
            $table->index(['teacher_id', 'status', 'confirmed_at'], 'payment_logs_teacher_status_date_index');
        });

        // 14. secretaries
        Schema::table('secretaries', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('secretaries', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->cascadeOnDelete();
            $table->index('teacher_id', 'secretaries_teacher_id_index');
        });

        // 15. secretary_teacher
        Schema::table('secretary_teacher', function (Blueprint $table) {
            $table->dropUnique('secretary_profile_unique');
            $table->dropForeign(['teacher_profile_id']);
        });

        Schema::table('secretary_teacher', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->cascadeOnDelete();
            $table->unique(['secretary_id', 'teacher_id']);
        });

        // 16. video_access_grants
        Schema::table('video_access_grants', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('video_access_grants', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
        });

        // 17. videos
        Schema::table('videos', function (Blueprint $table) {
            $table->dropForeign(['teacher_profile_id']);
        });
        Schema::table('videos', function (Blueprint $table) {
            $table->dropIndex('videos_profile_status_index');
        });
        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn('teacher_profile_id');
            $table->foreignUuid('teacher_reference_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->index(['teacher_reference_id', 'status']);
        });

        Schema::enableForeignKeyConstraints();
    }
};
