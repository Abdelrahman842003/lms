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
        Schema::create('teacher_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->date('month'); // Stored as YYYY-MM-01
            $table->integer('student_count')->default(0);
            $table->decimal('amount_due', 10, 2)->default(0);
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->enum('status', ['pending', 'partial', 'paid'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['teacher_id', 'month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_subscriptions');
    }
};
