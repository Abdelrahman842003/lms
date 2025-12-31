<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('parent_device_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('parent_phone', 20);
            $table->string('token')->unique();
            $table->string('device_type')->default('web');
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->index('parent_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parent_device_tokens');
    }
};
