<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('point_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('teacher_id')->constrained()->cascadeOnDelete();
            $table->string('type', 50)->index(); // نوع المعاملة
            // Types: attendance, perfect_month, exam_score, exam_retake_bonus,
            // exam_first_place, streak_5, streak_10, manual_bonus,
            // ai_test_1, ai_test_2, ... (extensible for future types)
            $table->integer('points');
            $table->nullableUuidMorphs('reference'); // lecture_id, exam_id, etc.
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'teacher_id']);
            $table->index(['teacher_id', 'created_at'], 'idx_point_transactions_teacher_created');
            $table->index(['student_id', 'teacher_id'], 'idx_point_transactions_student_teacher');
            $table->index('created_at'); // For weekly queries
            $table->unique(['student_id', 'teacher_id', 'type', 'reference_type', 'reference_id'], 'unique_point_transaction');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_transactions');
    }
};
