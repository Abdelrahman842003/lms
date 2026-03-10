<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gamification_settings', function (Blueprint $table) {
            // ─── نقاط الفيديوهات (مخصصة لكل مدرس/أكاديمية) ───
            $table->integer('video_watch_points')->default(5)->after('streak_10_bonus');
            $table->integer('video_quiz_max_points')->default(20)->after('video_watch_points');
            $table->integer('video_quiz_perfect_bonus')->default(5)->after('video_quiz_max_points');
            $table->integer('video_first_watch_bonus')->default(5)->after('video_quiz_perfect_bonus');
        });
    }

    public function down(): void
    {
        Schema::table('gamification_settings', function (Blueprint $table) {
            $table->dropColumn([
                'video_watch_points',
                'video_quiz_max_points',
                'video_quiz_perfect_bonus',
                'video_first_watch_bonus',
            ]);
        });
    }
};
