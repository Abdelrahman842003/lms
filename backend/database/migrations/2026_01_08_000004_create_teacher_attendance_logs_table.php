<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('teacher_attendance_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('academy_id')->constrained('academies')->onDelete('cascade');
            $table->foreignUuid('teacher_id')->constrained('teachers')->onDelete('cascade');
            $table->date('date');
            $table->dateTime('checked_in_at')->nullable();
            $table->dateTime('checked_out_at')->nullable();
            $table->string('status')->default(\App\Domains\Auth\Enums\TeacherAttendanceStatus::ABSENT->value);
            $table->text('notes')->nullable();
            $table->timestamps();

            // Index for faster queries
            $table->index(['academy_id', 'teacher_id', 'date']);
            $table->index(['academy_id', 'date'], 'attendance_academy_date_index');
            $table->index(['teacher_id', 'date'], 'attendance_teacher_date_index');
            $table->index('status', 'attendance_status_index');
            $table->index('date', 'attendance_date_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_attendance_logs');
    }
};
