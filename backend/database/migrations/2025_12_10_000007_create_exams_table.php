<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('teachers')->onDelete('cascade');
            $table->string('title');
            $table->string('subject');
            $table->integer('max_score');
            $table->integer('actual_question_count')->default(10);
            $table->integer('time_per_question')->default(60); // in seconds
            $table->boolean('is_active')->default(false);
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->date('date');
            $table->integer('duration'); // Duration in minutes
            $table->foreignUuid('grade_id')->nullable()->constrained('grades')->onDelete('set null');
            $table->foreignUuid('group_id')->nullable()->constrained('groups')->onDelete('set null');
            $table->timestamps();

            // Performance indexes
            $table->index(['teacher_id', 'is_active'], 'exams_teacher_active_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
