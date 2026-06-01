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
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->index('exam_id');
            $table->index('student_id');
            $table->dropUnique('exam_attempts_exam_id_student_id_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->unique(['exam_id', 'student_id']);
            $table->dropIndex(['exam_id']);
            $table->dropIndex(['student_id']);
        });
    }
};
