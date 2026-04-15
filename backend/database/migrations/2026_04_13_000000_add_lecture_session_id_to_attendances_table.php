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
        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignUuid('lecture_session_id')->nullable()->after('lecture_id')->constrained('lecture_sessions')->nullOnDelete();
            
            // Add index for performance
            $table->index(['lecture_session_id', 'status'], 'idx_attendance_session_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['lecture_session_id']);
            $table->dropColumn('lecture_session_id');
        });
    }
};
