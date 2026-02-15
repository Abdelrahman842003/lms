<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add subscription fields to academies table (same as teachers)
     */
    public function up(): void
    {
        Schema::table('academies', function (Blueprint $table) {
            $table->string('plan_type')->nullable()->after('billing_notes')
                ->comment('trial, fixed, custom - same as teachers');
            $table->date('plan_expires_at')->nullable()->after('plan_type');
            $table->integer('plan_max_students')->nullable()->after('plan_expires_at')
                ->comment('Maximum number of enrollments allowed');
            $table->boolean('is_unlimited_students')->default(false)->after('plan_max_students');
            $table->decimal('subscription_fee', 10, 2)->default(0)->after('is_unlimited_students');
            $table->decimal('paid_amount', 10, 2)->default(0)->after('subscription_fee');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academies', function (Blueprint $table) {
            $table->dropColumn([
                'plan_type',
                'plan_expires_at',
                'plan_max_students',
                'is_unlimited_students',
                'subscription_fee',
                'paid_amount',
            ]);
        });
    }
};