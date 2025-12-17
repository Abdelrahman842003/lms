<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_failed_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('teacher_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('question_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('exam_id')->constrained()->cascadeOnDelete();
            $table->string('student_answer')->nullable();
            $table->integer('times_failed')->default(1);
            $table->boolean('is_mastered')->default(false);
            $table->timestamp('mastered_at')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'question_id']);
            $table->index(['student_id', 'teacher_id', 'is_mastered']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_failed_questions');
    }
};
