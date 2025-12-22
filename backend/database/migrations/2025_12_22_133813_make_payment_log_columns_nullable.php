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
        Schema::table('payment_logs', function (Blueprint $table) {
            $table->uuid('enrollment_id')->nullable()->change();
            $table->uuid('student_id')->nullable()->change();
            $table->uuid('received_by_id')->nullable()->change();
            $table->string('received_by_type')->nullable()->change();
            $table->string('confirmation_code', 20)->nullable()->change();
            $table->timestamp('expires_at')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_logs', function (Blueprint $table) {
            $table->uuid('enrollment_id')->nullable(false)->change();
            $table->uuid('student_id')->nullable(false)->change();
            $table->uuid('received_by_id')->nullable(false)->change();
            $table->string('received_by_type')->nullable(false)->change();
            $table->string('confirmation_code', 20)->nullable(false)->change();
            $table->timestamp('expires_at')->nullable(false)->change();
        });
    }
};
