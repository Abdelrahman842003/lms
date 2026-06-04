<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Foreign Keys
            $table->foreignUuid('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignUuid('teacher_id')->constrained('teachers')->onDelete('cascade');
            $table->foreignUuid('grade_id')->nullable()->constrained('grades')->onDelete('set null');
            $table->foreignUuid('group_id')->nullable()->constrained('groups')->onDelete('set null');
            $table->uuid('academy_id')->nullable(); // Will add foreign key later
            
            // Enrollment-specific data (per teacher)
            $table->decimal('balance', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->date('subscription_start')->nullable();
            $table->date('subscription_end')->nullable();
            $table->text('teacher_notes')->nullable();
            
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for performance
            $table->index('updated_at');
            $table->index('student_id');
            $table->index('teacher_id');
            $table->index('academy_id');
            $table->index(['teacher_id', 'is_active'], 'enrollments_teacher_active_index');
            $table->index(['student_id', 'is_active'], 'enrollments_student_active_index');
            $table->index(['grade_id', 'is_active'], 'enrollments_grade_active_index');
            $table->index(['teacher_id', 'grade_id', 'is_active'], 'idx_enrollments_lookup');
            $table->index(['academy_id', 'teacher_id', 'is_active'], 'enrollments_academy_teacher_active_index');
            // Allow same student-teacher pair in different contexts (academy vs independent)
            $table->unique(['student_id', 'teacher_id', 'academy_id'], 'enrollment_context_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
