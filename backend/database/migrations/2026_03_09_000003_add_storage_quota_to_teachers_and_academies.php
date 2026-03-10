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
            $table->unsignedInteger('storage_limit_gb')
                ->nullable()
                ->default(null)
                ->after('plan_max_students')
                ->comment('الحد الأقصى للتخزين بالجيجا. null = غير محدود');

            $table->unsignedBigInteger('storage_used_bytes')
                ->default(0)
                ->after('storage_limit_gb')
                ->comment('إجمالي التخزين المستخدم بالبايت (فيديوهات + مرفقات)');
        });

        Schema::table('academies', function (Blueprint $table): void {
            $table->unsignedInteger('storage_limit_gb')
                ->nullable()
                ->default(null)
                ->after('plan_max_students')
                ->comment('الحد الأقصى للتخزين بالجيجا. null = غير محدود');

            $table->unsignedBigInteger('storage_used_bytes')
                ->default(0)
                ->after('storage_limit_gb')
                ->comment('إجمالي التخزين المستخدم بالبايت (فيديوهات + مرفقات)');
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table): void {
            $table->dropColumn(['storage_limit_gb', 'storage_used_bytes']);
        });

        Schema::table('academies', function (Blueprint $table): void {
            $table->dropColumn(['storage_limit_gb', 'storage_used_bytes']);
        });
    }
};
