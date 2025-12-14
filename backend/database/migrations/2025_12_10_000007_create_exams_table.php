<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('teachers')->onDelete('cascade');
            $table->string('title');
            $table->string('subject');
            $table->integer('max_score');
            $table->date('date');
            $table->integer('duration'); // Duration in minutes
            $table->foreignUuid('grade_id')->nullable()->constrained('grades')->onDelete('set null');
            $table->foreignUuid('group_id')->nullable()->constrained('groups')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
