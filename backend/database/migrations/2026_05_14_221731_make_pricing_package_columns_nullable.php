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
        Schema::table('pricing_packages', function (Blueprint $table) {
            $table->integer('max_students')->nullable()->change();
            $table->integer('storage_minutes')->nullable()->change();
            $table->integer('delivery_minutes')->nullable()->change();
            $table->decimal('overage_storage_price', 10, 2)->nullable()->change();
            $table->decimal('overage_delivery_price', 10, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pricing_packages', function (Blueprint $table) {
            $table->integer('max_students')->nullable(false)->change();
            $table->integer('storage_minutes')->nullable(false)->change();
            $table->integer('delivery_minutes')->nullable(false)->change();
            $table->decimal('overage_storage_price', 10, 2)->nullable(false)->change();
            $table->decimal('overage_delivery_price', 10, 2)->nullable(false)->change();
        });
    }
};
