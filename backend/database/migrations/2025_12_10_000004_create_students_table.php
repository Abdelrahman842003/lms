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
            $table->string('name');
            $table->string('username')->unique();
            $table->string('password');
            $table->rememberToken();
            
            // Optional/Profile fields
            $table->string('location')->nullable();
            $table->string('phone')->nullable();
            $table->string('parent_phone')->nullable();
            $table->enum('gender', ['male', 'female'])->default('male');
            $table->enum('education_type', ['general', 'azhar'])->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
