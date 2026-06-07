<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exam_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_profile_id')->nullable()->constrained('teacher_profiles')->cascadeOnDelete();
            
            // Polymorphic ownership columns
            $table->string('owner_type', 64)->nullable();
            $table->uuid('owner_id')->nullable();
            $table->index(['owner_type', 'owner_id']);
            $table->foreignUuid('grade_id')->nullable()->constrained('grades')->cascadeOnDelete();
            $table->string('subject')->nullable()->index();
            $table->text('text');
            $table->string('type')->default('mcq');
            $table->string('difficulty')->default('medium'); // easy, medium, hard
            $table->json('tags')->nullable();
            $table->json('options');
            $table->text('correct_answer');
            $table->integer('duration')->default(60); // Duration in seconds
            
            // Statistics
            $table->integer('usage_count')->default(0);
            $table->integer('correct_answers_count')->default(0);
            $table->integer('total_answers_count')->default(0);
            $table->integer('average_time')->default(0); // in seconds
            
            $table->timestamps();
        });

        Schema::create('exam_question', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('question_id')->constrained()->cascadeOnDelete();
            $table->integer('order')->default(0);
            $table->integer('points')->nullable(); // Optional override
            $table->timestamps();

            $table->unique(['exam_id', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_question');
        Schema::dropIfExists('questions');
    }
};
