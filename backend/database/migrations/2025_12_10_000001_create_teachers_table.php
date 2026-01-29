<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('phone')->unique();
            $table->string('subject')->nullable();
            $table->string('password');
            $table->string('avatar_key')->nullable();
            $table->enum('status', ['active', 'suspended', 'pending'])->default('pending');
            $table->boolean('is_independent_active')->default(true);
            $table->decimal('subscription_fee', 10, 2)->default(0);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->rememberToken();
            $table->timestamps();

            $table->index('phone');
            $table->index('id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
