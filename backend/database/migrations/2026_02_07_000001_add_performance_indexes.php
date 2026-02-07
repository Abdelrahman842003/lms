<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to add performance indexes.
     *
     * These indexes improve query performance for common operations:
     * - Filtering by status, teacher_id, academy_id
     * - Searching by phone
     * - Date range queries
     * - Sorting by created_at
     */
    public function up(): void
    {
        // ============================================
        // Students Table Indexes
        // ============================================
        Schema::table('students', function (Blueprint $table) {
            // Composite index for teacher + status filtering (common query)
            $table->index(['teacher_id', 'status'], 'students_teacher_status_index');

            // Index for phone search (used in login/search)
            $table->index('phone', 'students_phone_index');

            // Index for sorting by creation date
            $table->index('created_at', 'students_created_at_index');

            // Index for name search
            $table->index('name', 'students_name_index');
        });

        // ============================================
        // Teacher Attendance Logs Table Indexes
        // ============================================
        Schema::table('teacher_attendance_logs', function (Blueprint $table) {
            // Composite index for academy + date range queries
            $table->index(['academy_id', 'date'], 'attendance_academy_date_index');

            // Composite index for teacher + date queries
            $table->index(['teacher_id', 'date'], 'attendance_teacher_date_index');

            // Index for status filtering
            $table->index('status', 'attendance_status_index');

            // Index for date sorting
            $table->index('date', 'attendance_date_index');
        });

        // ============================================
        // Lectures Table Indexes
        // ============================================
        Schema::table('lectures', function (Blueprint $table) {
            // Composite index for teacher + date queries
            $table->index(['teacher_id', 'date'], 'lectures_teacher_date_index');

            // Composite index for academy + date queries
            $table->index(['academy_id', 'date'], 'lectures_academy_date_index');

            // Index for active status filtering
            $table->index('status', 'lectures_status_index');

            // Index for grade filtering
            $table->index('grade_id', 'lectures_grade_id_index');

            // Index for date range queries
            $table->index('date', 'lectures_date_index');
        });

        // ============================================
        // Exams Table Indexes
        // ============================================
        Schema::table('exams', function (Blueprint $table) {
            // Composite index for teacher + status filtering
            $table->index(['teacher_id', 'status'], 'exams_teacher_status_index');

            // Composite index for grade + group filtering
            $table->index(['grade_id', 'group_id'], 'exams_grade_group_index');

            // Index for status filtering
            $table->index('status', 'exams_status_index');

            // Index for date queries
            $table->index('date', 'exams_date_index');
        });

        // ============================================
        // Exam Attempts Table Indexes
        // ============================================
        Schema::table('exam_attempts', function (Blueprint $table) {
            // Composite index for student + exam queries
            $table->index(['student_id', 'exam_id'], 'exam_attempts_student_exam_index');

            // Index for status filtering
            $table->index('status', 'exam_attempts_status_index');

            // Index for completed_at sorting
            $table->index('completed_at', 'exam_attempts_completed_at_index');
        });

        // ============================================
        // Enrollments Table Indexes
        // ============================================
        Schema::table('enrollments', function (Blueprint $table) {
            // Composite index for student + teacher queries
            $table->index(['student_id', 'teacher_id'], 'enrollments_student_teacher_index');

            // Composite index for teacher + grade + group filtering
            $table->index(['teacher_id', 'grade_id', 'group_id'], 'enrollments_teacher_grade_group_index');

            // Index for active status
            $table->index('status', 'enrollments_status_index');
        });

        // ============================================
        // Notifications Table Indexes
        // ============================================
        Schema::table('notifications', function (Blueprint $table) {
            // Composite index for notifiable + read queries
            $table->index(['notifiable_id', 'notifiable_type', 'read_at'], 'notifications_notifiable_read_index');

            // Index for created_at sorting
            $table->index('created_at', 'notifications_created_at_index');

            // Index for type filtering
            $table->index('type', 'notifications_type_index');
        });

        // ============================================
        // Student Activity Logs Table Indexes
        // ============================================
        Schema::table('student_activity_logs', function (Blueprint $table) {
            // Composite index for student + date queries
            $table->index(['student_id', 'created_at'], 'activity_logs_student_date_index');

            // Index for activity type filtering
            $table->index('activity_type', 'activity_logs_type_index');

            // Index for date range queries
            $table->index('created_at', 'activity_logs_created_at_index');
        });

        // ============================================
        // Student Points Table Indexes
        // ============================================
        Schema::table('student_points', function (Blueprint $table) {
            // Composite index for student + teacher queries
            $table->index(['student_id', 'teacher_id'], 'points_student_teacher_index');

            // Index for sorting by points
            $table->index('total_points', 'points_total_index');
        });

        // ============================================
        // Login Attempts Table Indexes
        // ============================================
        Schema::table('login_attempts', function (Blueprint $table) {
            // Composite index for identifier + IP queries
            $table->index(['identifier', 'ip_address'], 'login_attempts_identifier_ip_index');

            // Index for IP-based rate limiting
            $table->index('ip_address', 'login_attempts_ip_index');

            // Index for expired at cleanup
            $table->index('expires_at', 'login_attempts_expires_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Students table
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex('students_teacher_status_index');
            $table->dropIndex('students_phone_index');
            $table->dropIndex('students_created_at_index');
            $table->dropIndex('students_name_index');
        });

        // Teacher attendance logs
        Schema::table('teacher_attendance_logs', function (Blueprint $table) {
            $table->dropIndex('attendance_academy_date_index');
            $table->dropIndex('attendance_teacher_date_index');
            $table->dropIndex('attendance_status_index');
            $table->dropIndex('attendance_date_index');
        });

        // Lectures
        Schema::table('lectures', function (Blueprint $table) {
            $table->dropIndex('lectures_teacher_date_index');
            $table->dropIndex('lectures_academy_date_index');
            $table->dropIndex('lectures_status_index');
            $table->dropIndex('lectures_grade_id_index');
            $table->dropIndex('lectures_date_index');
        });

        // Exams
        Schema::table('exams', function (Blueprint $table) {
            $table->dropIndex('exams_teacher_status_index');
            $table->dropIndex('exams_grade_group_index');
            $table->dropIndex('exams_status_index');
            $table->dropIndex('exams_date_index');
        });

        // Exam attempts
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->dropIndex('exam_attempts_student_exam_index');
            $table->dropIndex('exam_attempts_status_index');
            $table->dropIndex('exam_attempts_completed_at_index');
        });

        // Enrollments
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropIndex('enrollments_student_teacher_index');
            $table->dropIndex('enrollments_teacher_grade_group_index');
            $table->dropIndex('enrollments_status_index');
        });

        // Notifications
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_notifiable_read_index');
            $table->dropIndex('notifications_created_at_index');
            $table->dropIndex('notifications_type_index');
        });

        // Student activity logs
        Schema::table('student_activity_logs', function (Blueprint $table) {
            $table->dropIndex('activity_logs_student_date_index');
            $table->dropIndex('activity_logs_type_index');
            $table->dropIndex('activity_logs_created_at_index');
        });

        // Student points
        Schema::table('student_points', function (Blueprint $table) {
            $table->dropIndex('points_student_teacher_index');
            $table->dropIndex('points_total_index');
        });

        // Login attempts
        Schema::table('login_attempts', function (Blueprint $table) {
            $table->dropIndex('login_attempts_identifier_ip_index');
            $table->dropIndex('login_attempts_ip_index');
            $table->dropIndex('login_attempts_expires_at_index');
        });
    }
};
