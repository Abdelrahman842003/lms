<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration to add Cloudflare Stream specific fields to the videos table.
 * Other tables (teachers, academies, etc.) have been updated in their base migrations
 * to support minutes-based quotas natively.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            if (!Schema::hasColumn('videos', 'stream_uid')) {
                $table->string('stream_uid', 64)
                    ->nullable()
                    ->unique()
                    ->after('id')
                    ->comment('Cloudflare Stream video UID');
            }
        });
    }

    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table) {
            $table->dropColumn('stream_uid');
        });
    }
};
