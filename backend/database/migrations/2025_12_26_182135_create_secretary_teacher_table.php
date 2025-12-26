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
            $table->foreignUuid('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->json('permissions')->nullable();
            $table->timestamps();

            $table->unique(['secretary_id', 'teacher_id']);
        });

        // Make teacher_id nullable in secretaries table as it's now a many-to-many relationship
        Schema::table('secretaries', function (Blueprint $table) {
            $table->foreignUuid('teacher_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('secretary_teacher');
        
        Schema::table('secretaries', function (Blueprint $table) {
            $table->foreignUuid('teacher_id')->nullable(false)->change();
        });
    }
};
