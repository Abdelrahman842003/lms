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
        Schema::table('gamification_settings', function (Blueprint $table) {
            $table->integer('exam_fail_deduction')->default(10)->after('exam_first_place_bonus');
            $table->integer('exam_passing_percentage')->default(50)->after('exam_fail_deduction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gamification_settings', function (Blueprint $table) {
            $table->dropColumn(['exam_fail_deduction', 'exam_passing_percentage']);
        });
    }
};
