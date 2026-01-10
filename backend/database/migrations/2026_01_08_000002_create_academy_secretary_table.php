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
        Schema::create('academy_secretary', function (Blueprint $table) {
            $table->foreignUuid('academy_id')->constrained('academies')->onDelete('cascade');
            $table->foreignUuid('secretary_id')->constrained('secretaries')->onDelete('cascade');
            $table->json('permissions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Prevent duplicate entries
            $table->primary(['academy_id', 'secretary_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academy_secretary');
    }
};
