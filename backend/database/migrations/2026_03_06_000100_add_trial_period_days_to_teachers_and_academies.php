<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('teachers', 'trial_period_days')) {
            Schema::table('teachers', function (Blueprint $table) {
                $table->unsignedSmallInteger('trial_period_days')
                    ->nullable()
                    ->after('is_independent_active')
                    ->comment('Custom trial period in days for independent enrollments');
            });
        }

        if (!Schema::hasColumn('academies', 'trial_period_days')) {
            Schema::table('academies', function (Blueprint $table) {
                $table->unsignedSmallInteger('trial_period_days')
                    ->nullable()
                    ->after('is_active')
                    ->comment('Custom trial period in days for academy enrollments');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('teachers', 'trial_period_days')) {
            Schema::table('teachers', function (Blueprint $table) {
                $table->dropColumn('trial_period_days');
            });
        }

        if (Schema::hasColumn('academies', 'trial_period_days')) {
            Schema::table('academies', function (Blueprint $table) {
                $table->dropColumn('trial_period_days');
            });
        }
    }
};

