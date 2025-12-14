<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_activity_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            $table->foreignUuid('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignUuid('enrollment_id')->nullable()->constrained('enrollments')->onDelete('set null');
            
            $table->enum('action', [
                'enrolled',
                'unenrolled', 
                'group_change',
                'grade_change',
                'payment',
                'deduction',
                'merged',
                'status_change'
            ]);
            
            $table->json('data')->nullable(); // Additional context
            
            // Who performed the action
            $table->string('performed_by_type')->nullable(); // Teacher, Admin, System
            $table->uuid('performed_by_id')->nullable();
            
            $table->timestamp('created_at');
            
            // Indexes
            $table->index('student_id');
            $table->index('enrollment_id');
            $table->index('action');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_activity_logs');
    }
};
