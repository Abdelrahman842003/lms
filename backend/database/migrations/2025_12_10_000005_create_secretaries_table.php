<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('secretaries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->string('name');
            $table->string('phone')->nullable()->unique();
            $table->string('password');
            $table->string('avatar_key')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('permissions')->nullable();
            $table->timestamps();

            $table->index('phone');
            $table->index('teacher_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('secretaries');
    }
};
