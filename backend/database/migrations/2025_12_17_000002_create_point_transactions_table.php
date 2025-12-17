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
            $table->enum('type', [
                'attendance',           // حضور الحصة
                'perfect_month',        // حضور شهر كامل
                'exam_score',           // درجة الامتحان
                'exam_retake_bonus',    // إعادة الامتحان بنجاح
                'exam_first_place',     // أول الدفعة
                'streak_5',             // سلسلة 5 حصص
                'streak_10',            // سلسلة 10 حصص
                'manual_bonus',         // بونص يدوي من المدرس
            ]);
            $table->integer('points');
            $table->nullableUuidMorphs('reference'); // lecture_id, exam_id, etc.
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'teacher_id']);
            $table->index('created_at'); // For weekly queries
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('point_transactions');
    }
};
