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
        Schema::table('academy_notifications', function (Blueprint $table) {
            if (! Schema::hasColumn('academy_notifications', 'target_ids')) {
                $table->json('target_ids')->nullable()->after('target_type');
            }

            if (! Schema::hasColumn('academy_notifications', 'recipient_count')) {
                $table->unsignedInteger('recipient_count')->default(0)->after('target_ids');
            }

            if (! Schema::hasColumn('academy_notifications', 'recipient_snapshot')) {
                $table->json('recipient_snapshot')->nullable()->after('recipient_count');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academy_notifications', function (Blueprint $table) {
            if (Schema::hasColumn('academy_notifications', 'recipient_snapshot')) {
                $table->dropColumn('recipient_snapshot');
            }

            if (Schema::hasColumn('academy_notifications', 'recipient_count')) {
                $table->dropColumn('recipient_count');
            }

            if (Schema::hasColumn('academy_notifications', 'target_ids')) {
                $table->dropColumn('target_ids');
            }
        });
    }
};

