<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add subscription fields to teachers table (same as academies)
     */
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            // Add subscription plan fields if they don't exist
            if (!Schema::hasColumn('teachers', 'plan_type')) {
                $table->string('plan_type')->nullable()->after('is_independent_active')
                    ->comment('trial, fixed, custom - same as academies');
            }
            if (!Schema::hasColumn('teachers', 'plan_expires_at')) {
                $table->date('plan_expires_at')->nullable()->after('plan_type');
            }
            if (!Schema::hasColumn('teachers', 'plan_max_students')) {
                $table->integer('plan_max_students')->nullable()->after('plan_expires_at')
                    ->comment('Maximum number of students allowed');
            }
            if (!Schema::hasColumn('teachers', 'is_unlimited_students')) {
                $table->boolean('is_unlimited_students')->default(false)->after('plan_max_students');
            }
            // subscription_fee and paid_amount already exist in create_teachers_table
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            if (Schema::hasColumn('teachers', 'is_unlimited_students')) {
                $table->dropColumn('is_unlimited_students');
            }
            if (Schema::hasColumn('teachers', 'plan_max_students')) {
                $table->dropColumn('plan_max_students');
            }
            if (Schema::hasColumn('teachers', 'plan_expires_at')) {
                $table->dropColumn('plan_expires_at');
            }
            if (Schema::hasColumn('teachers', 'plan_type')) {
                $table->dropColumn('plan_type');
            }
            // Note: subscription_fee and paid_amount are kept as they exist in create_teachers_table
        });
    }
};
