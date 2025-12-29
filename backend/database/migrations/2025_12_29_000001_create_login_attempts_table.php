<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('login_attempts', function (Blueprint $table) {
            $table->id();
            $table->string('identifier'); // phone/email/username
            $table->ipAddress('ip_address');
            $table->integer('attempts')->default(0);
            $table->integer('ban_level')->default(0); // Escalating ban level (0, 1, 2, 3...)
            $table->timestamp('banned_until')->nullable();
            $table->timestamps();
            
            $table->index(['identifier', 'ip_address']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_attempts');
    }
};
