<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_results', function (Blueprint $table) {
            $table->decimal('percentage', 5, 2)->default(0)->after('score');
            $table->foreignUuid('attempt_id')->nullable()->after('percentage')->constrained('exam_attempts')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('exam_results', function (Blueprint $table) {
            $table->dropForeign(['attempt_id']);
            $table->dropColumn(['percentage', 'attempt_id']);
        });
    }
};
