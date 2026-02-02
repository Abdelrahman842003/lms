<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('lecture_id')->constrained('lectures')->onDelete('cascade');
            $table->foreignUuid('student_id')->constrained('students')->onDelete('cascade');
            $table->string('status')->default(\App\Enums\StudentAttendanceStatus::ABSENT->value);
            $table->timestamps();

            // Performance indexes
            $table->index(['lecture_id', 'created_at'], 'attendances_lecture_date_index');
            $table->index(['student_id', 'created_at'], 'attendances_student_date_index');
            $table->index(['lecture_id', 'status'], 'idx_attendance_lecture');
            $table->index(['student_id', 'lecture_id'], 'idx_attendance_student');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
