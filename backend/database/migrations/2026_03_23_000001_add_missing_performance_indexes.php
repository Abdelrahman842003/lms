<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to add missing performance indexes.
     * These indexes were identified during the Performance & SQL Review.
     */
    public function up(): void
    {
        // ============================================
        // Enrollments Table Indexes
        // ============================================
        Schema::table('enrollments', function (Blueprint $table) {
            // Index for student active enrollments queries (StudentService, DashboardService)
            if (!$this->hasIndex('enrollments', 'enrollments_student_active_index')) {
                $table->index(['student_id', 'is_active'], 'enrollments_student_active_index');
            }
            
            // Index for teacher active enrollments queries (used extensively in reports)
            if (!$this->hasIndex('enrollments', 'enrollments_teacher_active_index')) {
                $table->index(['teacher_id', 'is_active'], 'enrollments_teacher_active_index');
            }
            
            // Composite index for academy + teacher filtering
            if (!$this->hasIndex('enrollments', 'enrollments_academy_teacher_active_index')) {
                $table->index(['academy_id', 'teacher_id', 'is_active'], 'enrollments_academy_teacher_active_index');
            }
        });

        // ============================================
        // Video Access Grants Table Indexes
        // ============================================
        Schema::table('video_access_grants', function (Blueprint $table) {
            // Index for checking student access to videos
            if (!$this->hasIndex('video_access_grants', 'vag_student_video_index')) {
                $table->index(['student_id', 'video_id'], 'vag_student_video_index');
            }
            
            // Index for revoked grants queries
            if (!$this->hasIndex('video_access_grants', 'vag_revoked_index')) {
                $table->index(['revoked_at'], 'vag_revoked_index');
            }
        });

        // ============================================
        // Video Reminders Table Indexes
        // ============================================
        Schema::table('video_reminders', function (Blueprint $table) {
            // Index for pending reminders processing (VideoReminderService)
            if (!$this->hasIndex('video_reminders', 'vr_pending_index')) {
                $table->index(['next_reminder_at', 'stopped_at'], 'vr_pending_index');
            }
            
            // Index for student video reminder lookup
            if (!$this->hasIndex('video_reminders', 'vr_student_video_index')) {
                $table->index(['student_id', 'video_id'], 'vr_student_video_index');
            }
        });

        // ============================================
        // Payment Logs Table Indexes
        // ============================================
        Schema::table('payment_logs', function (Blueprint $table) {
            // Index for teacher payment reports
            if (!$this->hasIndex('payment_logs', 'payment_logs_teacher_status_date_index')) {
                $table->index(['teacher_id', 'status', 'confirmed_at'], 'payment_logs_teacher_status_date_index');
            }
            
            // Index for student payment history
            if (!$this->hasIndex('payment_logs', 'payment_logs_student_index')) {
                $table->index(['student_id', 'created_at'], 'payment_logs_student_index');
            }
        });

        // ============================================
        // Video Watch Progress Table Indexes
        // ============================================
        Schema::table('video_watch_progress', function (Blueprint $table) {
            // Index for checking student progress on videos (VideoReminderService)
            if (!$this->hasIndex('video_watch_progress', 'vwp_student_video_index')) {
                $table->index(['student_id', 'video_id'], 'vwp_student_video_index');
            }
        });

        // ============================================
        // Attendances Table Indexes
        // ============================================
        Schema::table('attendances', function (Blueprint $table) {
            // Index for lecture attendance stats (DashboardService)
            if (!$this->hasIndex('attendances', 'attendances_lecture_status_index')) {
                $table->index(['lecture_id', 'status'], 'attendances_lecture_status_index');
            }
            
            // Index for student attendance history
            if (!$this->hasIndex('attendances', 'attendances_student_index')) {
                $table->index(['student_id', 'created_at'], 'attendances_student_index');
            }
        });

        // ============================================
        // Exam Results Table Indexes
        // ============================================
        Schema::table('exam_results', function (Blueprint $table) {
            // Index for student exam history
            if (!$this->hasIndex('exam_results', 'exam_results_student_index')) {
                $table->index(['student_id', 'created_at'], 'exam_results_student_index');
            }
            
            // Index for exam statistics
            if (!$this->hasIndex('exam_results', 'exam_results_exam_index')) {
                $table->index(['exam_id', 'score'], 'exam_results_exam_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Enrollments
        Schema::table('enrollments', function (Blueprint $table) {
            if ($this->hasIndex('enrollments', 'enrollments_student_active_index')) {
                $table->dropIndex('enrollments_student_active_index');
            }
            if ($this->hasIndex('enrollments', 'enrollments_teacher_active_index')) {
                $table->dropIndex('enrollments_teacher_active_index');
            }
            if ($this->hasIndex('enrollments', 'enrollments_academy_teacher_active_index')) {
                $table->dropIndex('enrollments_academy_teacher_active_index');
            }
        });

        // Video Access Grants
        Schema::table('video_access_grants', function (Blueprint $table) {
            if ($this->hasIndex('video_access_grants', 'vag_student_video_index')) {
                $table->dropIndex('vag_student_video_index');
            }
            if ($this->hasIndex('video_access_grants', 'vag_revoked_index')) {
                $table->dropIndex('vag_revoked_index');
            }
        });

        // Video Reminders
        Schema::table('video_reminders', function (Blueprint $table) {
            if ($this->hasIndex('video_reminders', 'vr_pending_index')) {
                $table->dropIndex('vr_pending_index');
            }
            if ($this->hasIndex('video_reminders', 'vr_student_video_index')) {
                $table->dropIndex('vr_student_video_index');
            }
        });

        // Payment Logs
        Schema::table('payment_logs', function (Blueprint $table) {
            if ($this->hasIndex('payment_logs', 'payment_logs_teacher_status_date_index')) {
                $table->dropIndex('payment_logs_teacher_status_date_index');
            }
            if ($this->hasIndex('payment_logs', 'payment_logs_student_index')) {
                $table->dropIndex('payment_logs_student_index');
            }
        });

        // Video Watch Progress
        Schema::table('video_watch_progress', function (Blueprint $table) {
            if ($this->hasIndex('video_watch_progress', 'vwp_student_video_index')) {
                $table->dropIndex('vwp_student_video_index');
            }
        });

        // Attendances
        Schema::table('attendances', function (Blueprint $table) {
            if ($this->hasIndex('attendances', 'attendances_lecture_status_index')) {
                $table->dropIndex('attendances_lecture_status_index');
            }
            if ($this->hasIndex('attendances', 'attendances_student_index')) {
                $table->dropIndex('attendances_student_index');
            }
        });

        // Exam Results
        Schema::table('exam_results', function (Blueprint $table) {
            if ($this->hasIndex('exam_results', 'exam_results_student_index')) {
                $table->dropIndex('exam_results_student_index');
            }
            if ($this->hasIndex('exam_results', 'exam_results_exam_index')) {
                $table->dropIndex('exam_results_exam_index');
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
