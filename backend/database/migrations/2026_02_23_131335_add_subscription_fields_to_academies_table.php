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
        Schema::table('academies', function (Blueprint $table) {
            if (!Schema::hasColumn('academies', 'plan_type')) {
                $table->string('plan_type')->nullable()->after('billing_notes')
                    ->comment('trial, term, custom');
            }
            if (!Schema::hasColumn('academies', 'plan_expires_at')) {
                $table->date('plan_expires_at')->nullable()->after('plan_type');
            }
            if (!Schema::hasColumn('academies', 'plan_max_students')) {
                $table->integer('plan_max_students')->nullable()->after('plan_expires_at')
                    ->comment('Maximum number of students allowed');
            }
            if (!Schema::hasColumn('academies', 'is_unlimited_students')) {
                $table->boolean('is_unlimited_students')->default(false)->after('plan_max_students');
            }
            if (!Schema::hasColumn('academies', 'subscription_fee')) {
                $table->decimal('subscription_fee', 10, 2)->default(0)->after('is_unlimited_students');
            }
            if (!Schema::hasColumn('academies', 'paid_amount')) {
                $table->decimal('paid_amount', 10, 2)->default(0)->after('subscription_fee');
            }
        });    }

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
