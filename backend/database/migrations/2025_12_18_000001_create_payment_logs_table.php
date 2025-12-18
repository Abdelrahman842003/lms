<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('client_side_uuid')->unique(); // Idempotency key
            $table->uuid('enrollment_id');
            $table->uuid('student_id');
            $table->uuid('teacher_id');
            $table->decimal('amount', 10, 2);
            $table->string('confirmation_code', 20)->index(); // XXXX-XXXX
            $table->enum('status', ['pending', 'confirmed', 'expired', 'cancelled'])
                  ->default('pending');
            $table->string('payment_method')->default('cash');
            $table->uuid('received_by_id');
            $table->string('received_by_type'); // Teacher or Secretary
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('expires_at');
            $table->ipAddress('ip_address')->nullable(); // Security: confirmation IP
            $table->string('device_info')->nullable(); // Security: confirmation device
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index(['student_id', 'status']);
            $table->index(['teacher_id', 'status']);
            $table->index(['confirmation_code', 'student_id']); // Code lookup per student

            // Foreign keys
            $table->foreign('enrollment_id')->references('id')->on('enrollments')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('students')->onDelete('cascade');
            $table->foreign('teacher_id')->references('id')->on('teachers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_logs');
    }
};
