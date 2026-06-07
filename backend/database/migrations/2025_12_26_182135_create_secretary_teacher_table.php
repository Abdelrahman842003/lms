<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('secretary_teacher', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('secretary_id')->constrained('secretaries')->cascadeOnDelete();
            $table->foreignId('teacher_profile_id')->constrained('teacher_profiles')->cascadeOnDelete();
            $table->json('permissions')->nullable();
            $table->timestamps();

            $table->unique(['secretary_id', 'teacher_profile_id'], 'secretary_profile_unique');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('secretary_teacher');
        
    }
};
