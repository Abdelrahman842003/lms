<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('teachers')) {
            return;
        }

        Schema::table('teachers', function (Blueprint $table): void {
            if (! Schema::hasColumn('teachers', 'billing_notes')) {
                $table->text('billing_notes')->nullable()->after('paid_amount');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('teachers')) {
            return;
        }

        Schema::table('teachers', function (Blueprint $table): void {
            if (Schema::hasColumn('teachers', 'billing_notes')) {
                $table->dropColumn('billing_notes');
            }
        });
    }
};
