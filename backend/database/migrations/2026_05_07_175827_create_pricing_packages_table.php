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
            $table->string('type')->default('plan');
            $table->string('name_ar');
            $table->string('name_en')->nullable();
            $table->integer('max_students')->nullable()->default(0);
            $table->unsignedInteger('storage_minutes')->nullable()->comment('Included storage minutes per month');
            $table->unsignedInteger('delivery_minutes')->nullable()->comment('Included delivery minutes per month');
            $table->decimal('overage_storage_price', 10, 2)->nullable()->comment('Price per extra storage minute (EGP)');
            $table->decimal('overage_delivery_price', 10, 2)->nullable()->comment('Price per extra delivery minute (EGP)');
            $table->decimal('price', 10, 2)->default(0.00);
            $table->decimal('discount_percentage', 10, 2)->nullable();
            $table->decimal('half_yearly_price', 10, 2)->default(0.00);
            $table->decimal('half_yearly_discount_percentage', 10, 2)->nullable();
            $table->decimal('yearly_price', 10, 2)->default(0.00);
            $table->decimal('yearly_discount_percentage', 10, 2)->nullable();
            $table->json('features')->nullable();
            $table->json('video_bundles')->nullable();
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
