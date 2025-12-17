<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gamification_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->unique()->constrained()->cascadeOnDelete();
            
            // Point values (all customizable per teacher)
            $table->integer('attendance_points')->default(10);
            $table->integer('perfect_month_bonus')->default(30);
            $table->integer('exam_max_points')->default(50);
            $table->integer('exam_retake_bonus')->default(20);
            $table->integer('exam_first_place_bonus')->default(25);
            $table->integer('streak_5_bonus')->default(15);
            $table->integer('streak_10_bonus')->default(30);
            
            // Feature toggles
            $table->boolean('is_enabled')->default(true);
            $table->boolean('show_leaderboard')->default(true);
            $table->integer('leaderboard_size')->default(5);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gamification_settings');
    }
};
