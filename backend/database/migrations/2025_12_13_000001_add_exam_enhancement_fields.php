<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->integer('actual_question_count')->default(10)->after('max_score');
            $table->integer('time_per_question')->default(60)->after('actual_question_count'); // in seconds
        });
    }

    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn(['actual_question_count', 'time_per_question']);
        });
    }
};
