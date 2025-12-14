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
            
            // Enrollment-specific data (per teacher)
            $table->decimal('balance', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->date('subscription_start')->nullable();
            $table->date('subscription_end')->nullable();
            $table->text('teacher_notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for performance
            $table->index('student_id');
            $table->index('teacher_id');
            $table->unique(['student_id', 'teacher_id'], 'enrollment_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
