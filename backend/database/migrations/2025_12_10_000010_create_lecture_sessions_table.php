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
        Schema::create('lecture_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('lecture_id')->constrained('lectures')->cascadeOnDelete();
            $table->date('date');
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_cancelled')->default(false);
            $table->timestamps();

            $table->unique(['lecture_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lecture_sessions');
    }
};
