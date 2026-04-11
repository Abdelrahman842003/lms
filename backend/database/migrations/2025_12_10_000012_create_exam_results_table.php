<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignUuid('student_id')->constrained('students')->onDelete('cascade');
            $table->decimal('score', 5, 2);
            $table->decimal('percentage', 5, 2)->default(0);
            $table->foreignUuid('attempt_id')->nullable()->constrained('exam_attempts')->onDelete('set null');
            $table->timestamps();

            // Performance indexes
            $table->index(['exam_id', 'student_id'], 'exam_results_exam_student_index');
            $table->index(['exam_id', 'student_id'], 'idx_exam_results_lookup');
            $table->index(['student_id', 'created_at'], 'idx_exam_results_student');
            $table->index(['student_id', 'created_at'], 'exam_results_student_index');
            $table->index(['exam_id', 'score'], 'exam_results_exam_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_results');
    }
};
