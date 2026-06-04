<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exam_id')->constrained('exams')->onDelete('cascade');
            $table->foreignUuid('student_id')->constrained('students')->onDelete('cascade');
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->json('questions_order'); // Array of question IDs in randomized order
            $table->integer('current_question_index')->default(0);
            $table->string('status')->default(\App\Domains\Exams\Enums\ExamAttemptStatus::IN_PROGRESS->value);
            $table->string('terminated_reason')->nullable(); // 'visibility_change', 'screen_resize', 'time_expired'
            $table->timestamps();

            $table->index('exam_id');
            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempts');
    }
};
