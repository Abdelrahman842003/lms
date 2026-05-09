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
        Schema::table('pricing_packages', function (Blueprint $table) {
            $table->renameColumn('discount_price', 'discount_percentage');
            $table->renameColumn('yearly_discount_price', 'yearly_discount_percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pricing_packages', function (Blueprint $table) {
            $table->renameColumn('discount_percentage', 'discount_price');
            $table->renameColumn('yearly_discount_percentage', 'yearly_discount_price');
        });
    }
};
