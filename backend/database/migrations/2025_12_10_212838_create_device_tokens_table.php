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
        Schema::create('device_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token')->unique();
            $table->nullableUuidMorphs('tokenable'); // Adds tokenable_id (UUID) and tokenable_type
            $table->string('device_type')->default(\App\Domains\Auth\Enums\DeviceType::WEB->value);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();


        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device_tokens');
    }
};
