<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->foreignUuid('grade_id')->nullable()->constrained('grades')->onDelete('set null');
            $table->foreignUuid('teacher_id')->constrained('teachers')->onDelete('cascade');
            $table->enum('type', ['general', 'private'])->default('general');
            $table->decimal('price', 8, 2)->nullable();
            $table->string('time')->nullable();
            $table->string('days')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('groups');
    }
};
