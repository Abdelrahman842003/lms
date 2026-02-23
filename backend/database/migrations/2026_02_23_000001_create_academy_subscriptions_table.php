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
        Schema::create('academy_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('academy_id');
            $table->date('month'); // Stored as YYYY-MM-01
            $table->integer('student_count')->default(0);
            $table->decimal('amount_due', 10, 2)->default(0);
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->string('payment_key', 20)->nullable()->unique();
            $table->timestamp('payment_initiated_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->timestamps();
            
            $table->index(['academy_id', 'month']);
            $table->foreign('academy_id')->references('id')->on('academies')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academy_subscriptions');
    }
};
