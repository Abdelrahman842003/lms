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
            $table->uuid('academy_id')->nullable()->after('teacher_id');
            $table->foreign('academy_id')->references('id')->on('academies')->nullOnDelete();
            $table->index(['academy_id', 'is_active'], 'lectures_academy_active_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lectures', function (Blueprint $table) {
            $table->dropIndex('lectures_academy_active_index');
            $table->dropForeign(['academy_id']);
            $table->dropColumn('academy_id');
        });
    }
};
