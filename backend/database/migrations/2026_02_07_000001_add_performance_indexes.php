<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to add performance indexes.
     */
    public function up(): void
    {
        // ============================================
        // Students Table Indexes
        // ============================================
        Schema::table('students', function (Blueprint $table) {
            if (!$this->hasIndex('students', 'students_created_at_index')) {
                $table->index('created_at', 'students_created_at_index');
            }
            if (!$this->hasIndex('students', 'students_name_index')) {
                $table->index('name', 'students_name_index');
            }
        });

        // ============================================
        // Teacher Attendance Logs Table Indexes
        // ============================================
        Schema::table('teacher_attendance_logs', function (Blueprint $table) {
            if (!$this->hasIndex('teacher_attendance_logs', 'attendance_academy_date_index')) {
                $table->index(['academy_id', 'date'], 'attendance_academy_date_index');
            }
            if (!$this->hasIndex('teacher_attendance_logs', 'attendance_teacher_date_index')) {
                $table->index(['teacher_id', 'date'], 'attendance_teacher_date_index');
            }
            if (!$this->hasIndex('teacher_attendance_logs', 'attendance_status_index')) {
                $table->index('status', 'attendance_status_index');
            }
            if (!$this->hasIndex('teacher_attendance_logs', 'attendance_date_index')) {
                $table->index('date', 'attendance_date_index');
            }
        });

        // ============================================
        // Lectures Table Indexes
        // ============================================
        Schema::table('lectures', function (Blueprint $table) {
            if (!$this->hasIndex('lectures', 'lectures_teacher_start_time_index')) {
                $table->index(['teacher_id', 'start_time'], 'lectures_teacher_start_time_index');
            }
            if (!$this->hasIndex('lectures', 'lectures_academy_start_time_index')) {
                $table->index(['academy_id', 'start_time'], 'lectures_academy_start_time_index');
            }
            if (!$this->hasIndex('lectures', 'lectures_is_active_index')) {
                $table->index('is_active', 'lectures_is_active_index');
            }
            if (!$this->hasIndex('lectures', 'lectures_grade_id_index')) {
                $table->index('grade_id', 'lectures_grade_id_index');
            }
            if (!$this->hasIndex('lectures', 'lectures_start_time_index')) {
                $table->index('start_time', 'lectures_start_time_index');
            }
        });

        // ============================================
        // Exams Table Indexes
        // ============================================
        Schema::table('exams', function (Blueprint $table) {
            if (!$this->hasIndex('exams', 'exams_teacher_is_active_index')) {
                $table->index(['teacher_id', 'is_active'], 'exams_teacher_is_active_index');
            }
            if (!$this->hasIndex('exams', 'exams_grade_group_index')) {
                $table->index(['grade_id', 'group_id'], 'exams_grade_group_index');
            }
            if (!$this->hasIndex('exams', 'exams_is_active_index')) {
                $table->index('is_active', 'exams_is_active_index');
            }
            if (!$this->hasIndex('exams', 'exams_date_index')) {
                $table->index('date', 'exams_date_index');
            }
        });

        // ============================================
        // Notifications Table Indexes
        // ============================================
        Schema::table('notifications', function (Blueprint $table) {
            if (!$this->hasIndex('notifications', 'notifications_notifiable_read_index')) {
                $table->index(['notifiable_id', 'notifiable_type', 'read_at'], 'notifications_notifiable_read_index');
            }
            if (!$this->hasIndex('notifications', 'notifications_created_at_index')) {
                $table->index('created_at', 'notifications_created_at_index');
            }
            if (!$this->hasIndex('notifications', 'notifications_type_index')) {
                $table->index('type', 'notifications_type_index');
            }
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Students table
        Schema::table('students', function (Blueprint $table) {
            if ($this->hasIndex('students', 'students_created_at_index')) {
                $table->dropIndex('students_created_at_index');
            }
            if ($this->hasIndex('students', 'students_name_index')) {
                $table->dropIndex('students_name_index');
            }
        });

        // Teacher attendance logs
        Schema::table('teacher_attendance_logs', function (Blueprint $table) {
            if ($this->hasIndex('teacher_attendance_logs', 'attendance_academy_date_index')) {
                $table->dropIndex('attendance_academy_date_index');
            }
            if ($this->hasIndex('teacher_attendance_logs', 'attendance_teacher_date_index')) {
                $table->dropIndex('attendance_teacher_date_index');
            }
            if ($this->hasIndex('teacher_attendance_logs', 'attendance_status_index')) {
                $table->dropIndex('attendance_status_index');
            }
            if ($this->hasIndex('teacher_attendance_logs', 'attendance_date_index')) {
                $table->dropIndex('attendance_date_index');
            }
        });

        // Lectures
        Schema::table('lectures', function (Blueprint $table) {
            if ($this->hasIndex('lectures', 'lectures_teacher_start_time_index')) {
                $table->dropIndex('lectures_teacher_start_time_index');
            }
            if ($this->hasIndex('lectures', 'lectures_academy_start_time_index')) {
                $table->dropIndex('lectures_academy_start_time_index');
            }
            if ($this->hasIndex('lectures', 'lectures_is_active_index')) {
                $table->dropIndex('lectures_is_active_index');
            }
            if ($this->hasIndex('lectures', 'lectures_grade_id_index')) {
                $table->dropIndex('lectures_grade_id_index');
            }
            if ($this->hasIndex('lectures', 'lectures_start_time_index')) {
                $table->dropIndex('lectures_start_time_index');
            }
        });

        // Exams
        Schema::table('exams', function (Blueprint $table) {
            if ($this->hasIndex('exams', 'exams_teacher_is_active_index')) {
                $table->dropIndex('exams_teacher_is_active_index');
            }
            if ($this->hasIndex('exams', 'exams_grade_group_index')) {
                $table->dropIndex('exams_grade_group_index');
            }
            if ($this->hasIndex('exams', 'exams_is_active_index')) {
                $table->dropIndex('exams_is_active_index');
            }
            if ($this->hasIndex('exams', 'exams_date_index')) {
                $table->dropIndex('exams_date_index');
            }
        });

        // Notifications
        Schema::table('notifications', function (Blueprint $table) {
            if ($this->hasIndex('notifications', 'notifications_notifiable_read_index')) {
                $table->dropIndex('notifications_notifiable_read_index');
            }
            if ($this->hasIndex('notifications', 'notifications_created_at_index')) {
                $table->dropIndex('notifications_created_at_index');
            }
            if ($this->hasIndex('notifications', 'notifications_type_index')) {
                $table->dropIndex('notifications_type_index');
            }
        });

    }

    /**
     * Check if an index exists on a table.
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        $indexes = Schema::getIndexes($table);
        foreach ($indexes as $index) {
            if ($index['name'] === $indexName) {
                return true;
            }
        }
        return false;
    }
};
