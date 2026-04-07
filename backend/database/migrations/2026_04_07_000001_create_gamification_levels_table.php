<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gamification_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');                    // "حكيم"
            $table->string('description')->nullable(); // وصف المستوى
            $table->string('icon')->nullable();        // SVG name or emoji
            $table->string('color')->nullable();       // hex color for UI
            $table->integer('min_points');              // الحد الأدنى
            $table->integer('max_points')->nullable();  // null = unlimited (last level)
            $table->integer('sort_order');              // 1-10
            $table->timestamps();

            $table->unique('sort_order');
            $table->index('min_points');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gamification_levels');
    }
};
