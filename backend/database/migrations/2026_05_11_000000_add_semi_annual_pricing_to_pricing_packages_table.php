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
            $table->decimal('half_yearly_price', 10, 2)->default(0.00)->after('discount_percentage');
            $table->decimal('half_yearly_discount_percentage', 10, 2)->nullable()->after('half_yearly_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pricing_packages', function (Blueprint $table) {
            $table->dropColumn(['half_yearly_price', 'half_yearly_discount_percentage']);
        });
    }
};
