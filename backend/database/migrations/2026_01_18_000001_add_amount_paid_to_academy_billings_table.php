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
        Schema::table('academy_billings', function (Blueprint $table) {
            $table->decimal('amount_paid', 10, 2)->default(0)->after('total_cost');
        });
        
        // Modify enum to include 'partial'
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE academy_billings MODIFY COLUMN status ENUM('pending', 'partial', 'paid', 'cancelled') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academy_billings', function (Blueprint $table) {
            $table->dropColumn('amount_paid');
        });
    }
};
