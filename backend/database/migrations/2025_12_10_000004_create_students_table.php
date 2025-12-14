<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('teachers')->onDelete('cascade');
            $table->string('name');
            $table->string('username');
            $table->string('password');
            $table->rememberToken();
            
            // Optional/Profile fields
            $table->string('location')->nullable();
            $table->foreignUuid('grade_id')->nullable()->constrained('grades')->onDelete('set null');
            $table->foreignUuid('group_id')->nullable()->constrained('groups')->onDelete('set null');
            $table->string('phone')->nullable();
            $table->string('parent_phone')->nullable();
            $table->enum('gender', ['male', 'female'])->default('male');
            $table->enum('education_type', ['general', 'azhar'])->nullable();
            $table->decimal('balance', 10, 2)->default(0);
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Ensure unique username per teacher
            $table->unique(['teacher_id', 'username']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
