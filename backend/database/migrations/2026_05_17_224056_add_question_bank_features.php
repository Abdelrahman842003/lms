<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update questions table
        Schema::table('questions', function (Blueprint $table) {
            // Drop foreign key before changing column (safe approach)
            $table->dropForeign(['exam_id']);
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->foreignUuid('exam_id')->nullable()->change();
            $table->foreign('exam_id')->references('id')->on('exams')->cascadeOnDelete();

            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->cascadeOnDelete()->after('exam_id');
            $table->string('difficulty')->default('medium')->after('type'); // easy, medium, hard
            $table->json('tags')->nullable()->after('difficulty');
            
            // Statistics
            $table->integer('usage_count')->default(0);
            $table->integer('correct_answers_count')->default(0);
            $table->integer('total_answers_count')->default(0);
            $table->integer('average_time')->default(0); // in seconds
        });

        // 2. Create exam_question pivot table
        Schema::create('exam_question', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('question_id')->constrained()->cascadeOnDelete();
            $table->integer('order')->default(0);
            $table->integer('points')->nullable(); // Optional override
            $table->timestamps();

            $table->unique(['exam_id', 'question_id']);
        });

        // 3. Update exams table
        Schema::table('exams', function (Blueprint $table) {
            $table->string('type')->default('manual')->after('title'); // manual, dynamic, self_test
            $table->json('dynamic_settings')->nullable()->after('type');
        });

        // 4. Update student_answers table for snapshotting
        Schema::table('student_answers', function (Blueprint $table) {
            $table->json('question_snapshot')->nullable()->after('question_id');
        });
    }

    public function down(): void
    {
        Schema::table('student_answers', function (Blueprint $table) {
            $table->dropColumn('question_snapshot');
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn(['type', 'dynamic_settings']);
        });

        Schema::dropIfExists('exam_question');

        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);
            $table->dropColumn([
                'teacher_id', 
                'difficulty', 
                'tags', 
                'usage_count', 
                'correct_answers_count', 
                'total_answers_count', 
                'average_time'
            ]);
            
            $table->dropForeign(['exam_id']);
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->foreignUuid('exam_id')->nullable(false)->change();
            $table->foreign('exam_id')->references('id')->on('exams')->cascadeOnDelete();
        });
    }
};
