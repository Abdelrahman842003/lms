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
        Schema::table('academy_billings', function (Blueprint $table) {
            // Payment key for InstaPay tracking (e.g., PAY-ABCD1234)
            $table->string('payment_key', 20)->nullable()->unique()->after('notes');
            
            // When the academy initiated InstaPay payment
            $table->timestamp('payment_initiated_at')->nullable()->after('payment_key');
            
            // Payment method: 'admin' (confirmed by admin directly) or 'instapay' (via InstaPay)
            $table->enum('payment_method', ['admin', 'instapay'])->nullable()->after('payment_initiated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academy_billings', function (Blueprint $table) {
            $table->dropColumn(['payment_key', 'payment_initiated_at', 'payment_method']);
        });
    }
};
