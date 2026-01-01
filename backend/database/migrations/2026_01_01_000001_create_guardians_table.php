<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('guardians', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('phone')->unique(); // Guardian phone number
            $table->string('name'); // Guardian full name
            $table->string('password'); // Independent password
            $table->string('avatar_key')->nullable();
            $table->rememberToken();
            $table->timestamps();
            
            $table->index('phone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guardians');
    }
};
