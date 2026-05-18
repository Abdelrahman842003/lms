<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gamification_settings', function (Blueprint $table) {
            $table->integer('question_easy_points')->default(1)->after('exam_first_place_bonus');
            $table->integer('question_medium_points')->default(2)->after('question_easy_points');
            $table->integer('question_hard_points')->default(3)->after('question_medium_points');
        });
    }

    public function down(): void
    {
        Schema::table('gamification_settings', function (Blueprint $table) {
            $table->dropColumn([
                'question_easy_points',
                'question_medium_points',
                'question_hard_points'
            ]);
        });
    }
};
