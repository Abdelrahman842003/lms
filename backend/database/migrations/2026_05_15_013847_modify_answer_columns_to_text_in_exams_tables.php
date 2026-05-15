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
        Schema::table('questions', function (Blueprint $table) {
            $table->text('correct_answer')->change();
        });

        Schema::table('student_answers', function (Blueprint $table) {
            $table->text('answer')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->string('correct_answer')->change();
        });

        Schema::table('student_answers', function (Blueprint $table) {
            $table->string('answer')->nullable()->change();
        });
    }
};
