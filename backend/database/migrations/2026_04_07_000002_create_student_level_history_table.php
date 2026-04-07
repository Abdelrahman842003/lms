<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_level_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('level_id')->constrained('gamification_levels')->cascadeOnDelete();
            $table->integer('points_at_levelup');           // إجمالي النقاط وقت الترقية
            $table->string('certificate_path')->nullable(); // مسار PDF في storage
            $table->timestamp('achieved_at');
            $table->timestamps();

            $table->index('student_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_level_history');
    }
};
