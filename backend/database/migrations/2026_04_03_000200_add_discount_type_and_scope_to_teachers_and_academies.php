<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table): void {
            $table->string('discount_type', 20)
                ->default('percent')
                ->after('discount_percent')
                ->comment('نوع الخصم: percent أو fixed');

            $table->string('discount_scope', 20)
                ->default('general')
                ->after('discount_type')
                ->comment('نطاق الخصم: general أو students أو storage');
        });

        Schema::table('academies', function (Blueprint $table): void {
            $table->string('discount_type', 20)
                ->default('percent')
                ->after('discount_percent')
                ->comment('نوع الخصم: percent أو fixed');

            $table->string('discount_scope', 20)
                ->default('general')
                ->after('discount_type')
                ->comment('نطاق الخصم: general أو students أو storage');
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table): void {
            $table->dropColumn(['discount_type', 'discount_scope']);
        });

        Schema::table('academies', function (Blueprint $table): void {
            $table->dropColumn(['discount_type', 'discount_scope']);
        });
    }
};
