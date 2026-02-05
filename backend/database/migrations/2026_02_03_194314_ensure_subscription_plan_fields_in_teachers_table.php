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
        Schema::table('teachers', function (Blueprint $table) {
            // Add subscription plan fields if they don't exist
            if (!Schema::hasColumn('teachers', 'plan_type')) {
                $table->string('plan_type')->nullable()->after('is_independent_active');
            }
            if (!Schema::hasColumn('teachers', 'plan_expires_at')) {
                $table->timestamp('plan_expires_at')->nullable()->after('plan_type');
            }
            if (!Schema::hasColumn('teachers', 'plan_max_students')) {
                $table->integer('plan_max_students')->nullable()->after('plan_expires_at');
            }
            if (!Schema::hasColumn('teachers', 'is_unlimited_students')) {
                $table->boolean('is_unlimited_students')->default(false)->after('plan_max_students');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->dropColumn(['plan_type', 'plan_expires_at', 'plan_max_students', 'is_unlimited_students']);
        });
    }
};
