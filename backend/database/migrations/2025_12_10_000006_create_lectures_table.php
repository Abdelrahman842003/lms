<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lectures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('teachers')->onDelete('cascade');
            $table->foreignUuid('grade_id')->constrained('grades')->cascadeOnDelete();
            $table->uuid('group_id')->nullable();
            $table->foreign('group_id')->references('id')->on('groups')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('qr_code')->nullable()->unique();
            $table->timestamp('qr_code_expires_at')->nullable();
            $table->dateTime('start_time')->nullable();
            $table->dateTime('end_time')->nullable();
            $table->boolean('is_active')->default(false);
            $table->boolean('is_recurring')->default(false);
            $table->json('recurrence_days')->nullable();
            $table->time('recurrence_time')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->foreignUuid('parent_id')->nullable()->constrained('lectures')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lectures');
    }
};
