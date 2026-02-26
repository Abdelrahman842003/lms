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
            $table->string('password');
            $table->string('avatar_key')->nullable();
            $table->rememberToken();
            
            // Optional/Profile fields
            $table->string('location')->nullable();
            $table->string('phone')->nullable()->unique();
            $table->string('parent_phone')->nullable();
            $table->uuid('guardian_id')->nullable();
            $table->string('gender')->default(\App\Domains\Auth\Enums\StudentGender::MALE->value);
            $table->string('education_type')->nullable();
            
            $table->timestamps();
            
            $table->index('phone');
            $table->index('guardian_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
