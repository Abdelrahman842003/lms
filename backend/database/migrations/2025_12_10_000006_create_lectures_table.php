<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lectures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('teachers')->onDelete('cascade');
            $table->foreignUuid('academy_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('grade_id')->constrained('grades')->cascadeOnDelete();
            $table->uuid('group_id')->nullable();
            $table->foreign('group_id')->references('id')->on('groups')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('qr_code')->nullable()->unique();
            $table->timestamp('qr_code_expires_at')->nullable();
            $table->dateTime('start_time')->nullable();
            $table->dateTime('end_time')->nullable();
            $table->boolean('is_active')->default(false);
            $table->boolean('is_recurring')->default(false);
            $table->json('recurrence_days')->nullable();
            $table->time('recurrence_time')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->json('cancelled_dates')->nullable();
            $table->foreignUuid('parent_id')->nullable()->constrained('lectures')->nullOnDelete();
            $table->timestamps();

            // Performance indexes
            $table->index(['teacher_id', 'is_active'], 'lectures_teacher_active_index');
            $table->index(['grade_id', 'is_active'], 'lectures_grade_active_index');
            $table->index(['teacher_id', 'start_time', 'is_active'], 'idx_lectures_teacher_date');
            $table->index(['teacher_id', 'start_time'], 'lectures_teacher_start_time_index');
            $table->index(['academy_id', 'start_time'], 'lectures_academy_start_time_index');
            $table->index('is_active', 'lectures_is_active_index');
            $table->index('grade_id', 'lectures_grade_id_index');
            $table->index('start_time', 'lectures_start_time_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lectures');
    }
};
