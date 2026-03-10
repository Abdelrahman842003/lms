<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── 1. video_quizzes ────────────────────────────────────────────
        Schema::create('video_quizzes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('video_id')->unique()->constrained('videos')->cascadeOnDelete();
            $table->foreignUuid('teacher_id')->constrained('teachers')->cascadeOnDelete();

            $table->string('title');
            $table->integer('passing_score')->default(60);   // نسبة النجاح % (قابلة للتخصيص لكل فيديو)
            $table->boolean('is_required')->default(true);   // مطلوب لإتمام الفيديو؟
            $table->boolean('is_active')->default(true);     // مفعّل؟

            $table->timestamps();

            $table->index(['video_id', 'is_active']);
            $table->index(['teacher_id']);
        });

        // ─── 2. video_quiz_questions ─────────────────────────────────────
        Schema::create('video_quiz_questions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('video_quiz_id')->constrained('video_quizzes')->cascadeOnDelete();

            $table->text('text');                             // نص السؤال
            $table->json('options');                          // ["اختيار أ", "اختيار ب", ...]
            $table->string('correct_answer');                 // الإجابة الصحيحة
            $table->unsignedTinyInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index(['video_quiz_id', 'sort_order']);
        });

        // ─── 3. video_quiz_attempts ──────────────────────────────────────
        Schema::create('video_quiz_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('video_quiz_id')->constrained('video_quizzes')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();

            $table->unsignedTinyInteger('correct_count')->default(0);
            $table->unsignedTinyInteger('total_count')->default(0);
            $table->decimal('percentage', 5, 2)->default(0);
            $table->string('status', 16)->default('passed');  // passed | failed
            $table->json('answers')->nullable();               // snapshot إجابات الطالب

            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['video_quiz_id', 'student_id', 'status']);
            $table->index(['student_id', 'status']);
        });

        // ─── 4. إضافة أعمدة على video_watch_progresses ──────────────────
        Schema::table('video_watch_progresses', function (Blueprint $table) {
            // وقت اجتياز التدريب (null = لم يجتز بعد)
            $table->timestamp('quiz_passed_at')->nullable()->after('completed_at');
            // نقاط الفيديو تم منحها؟ (لتجنب التكرار)
            $table->boolean('video_points_awarded')->default(false)->after('quiz_passed_at');
        });
    }

    public function down(): void
    {
        Schema::table('video_watch_progresses', function (Blueprint $table) {
            $table->dropColumn(['quiz_passed_at', 'video_points_awarded']);
        });

        Schema::dropIfExists('video_quiz_attempts');
        Schema::dropIfExists('video_quiz_questions');
        Schema::dropIfExists('video_quizzes');
    }
};
