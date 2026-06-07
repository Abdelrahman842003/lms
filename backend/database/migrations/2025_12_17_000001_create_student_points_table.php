<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_points', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('teacher_profile_id')->constrained('teacher_profiles')->cascadeOnDelete();
            $table->integer('total_points')->default(0);
            $table->integer('attendance_streak')->default(0); // Current streak count
            $table->timestamps();

            $table->unique(['student_id', 'teacher_profile_id'], 'student_profile_points_unique');
            $table->index(['teacher_profile_id', 'total_points'], 'student_points_profile_total_points_index'); // For leaderboard queries
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_points');
    }
};
