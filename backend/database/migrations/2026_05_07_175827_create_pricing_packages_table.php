<?php

declare(strict_types=1);

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
        Schema::create('pricing_packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name_ar');
            $table->string('name_en')->nullable();
            $table->integer('max_students')->default(0);
            $table->integer('storage_limit_gb')->default(0);
            $table->decimal('price', 10, 2)->default(0.00);
            $table->decimal('discount_price', 10, 2)->nullable();
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_popular')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pricing_packages');
    }
};
