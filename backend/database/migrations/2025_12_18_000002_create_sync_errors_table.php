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
        Schema::create('sync_errors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('client_side_uuid');
            $table->string('operation_type'); // payment, attendance, etc.
            $table->json('payload'); // Original data
            $table->string('error_message');
            $table->string('error_code')->nullable();
            $table->uuid('user_id'); // Who tried to sync
            $table->string('user_type'); // Teacher, Secretary
            $table->boolean('resolved')->default(false);
            $table->uuid('resolved_by')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'resolved']);
            $table->index('operation_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_errors');
    }
};
