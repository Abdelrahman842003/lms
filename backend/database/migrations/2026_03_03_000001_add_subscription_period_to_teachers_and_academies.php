<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add missing subscription_period column to teachers and academies tables.
     * Used by SubscriptionRenewalService::approveRenewal to store the subscription period.
     */
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            if (! Schema::hasColumn('teachers', 'subscription_period')) {
                $table->string('subscription_period')->nullable()->after('plan_type')
                    ->comment('monthly, quarterly, semi_annual, annual, trial, custom');
            }
        });

        Schema::table('academies', function (Blueprint $table) {
            if (! Schema::hasColumn('academies', 'subscription_period')) {
                $table->string('subscription_period')->nullable()->after('plan_type')
                    ->comment('monthly, quarterly, semi_annual, annual, trial, custom');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            if (Schema::hasColumn('teachers', 'subscription_period')) {
                $table->dropColumn('subscription_period');
            }
        });

        Schema::table('academies', function (Blueprint $table) {
            if (Schema::hasColumn('academies', 'subscription_period')) {
                $table->dropColumn('subscription_period');
            }
        });
    }
};
