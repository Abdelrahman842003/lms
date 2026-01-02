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
        Schema::table('lectures', function (Blueprint $table) {
            $table->boolean('is_recurring')->default(false)->after('is_active');
            $table->json('recurrence_days')->nullable()->after('is_recurring');
            $table->time('recurrence_time')->nullable()->after('recurrence_days');
            $table->integer('duration_minutes')->nullable()->after('recurrence_time');
            $table->foreignUuid('parent_id')->nullable()->after('duration_minutes')->constrained('lectures')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lectures', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['is_recurring', 'recurrence_days', 'recurrence_time', 'duration_minutes', 'parent_id']);
        });
    }
};
