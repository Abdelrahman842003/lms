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
            $table->foreignUuid('teacher_id')->constrained()->cascadeOnDelete();
            $table->integer('total_points')->default(0);
            $table->integer('attendance_streak')->default(0); // Current streak count
            $table->timestamps();

            $table->unique(['student_id', 'teacher_id']);
            $table->index(['teacher_id', 'total_points']); // For leaderboard queries
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_points');
    }
};
