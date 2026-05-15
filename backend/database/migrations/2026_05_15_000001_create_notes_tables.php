<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('academy_id')->nullable()->index();
            $table->foreignUuid('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignUuid('grade_id')->constrained('grades')->cascadeOnDelete();
            
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['academy_id', 'is_active']);
            $table->index(['teacher_id', 'is_active']);
        });

        Schema::create('note_group_targets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('note_id')->constrained('notes')->cascadeOnDelete();
            $table->foreignUuid('group_id')->constrained('groups')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['note_id', 'group_id']);
        });

        Schema::create('note_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('note_id')->constrained('notes')->cascadeOnDelete();
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size');
            $table->timestamps();

            $table->index(['note_id']);
        });

        Schema::create('note_view_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('note_id')->constrained('notes')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['note_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('note_view_logs');
        Schema::dropIfExists('note_attachments');
        Schema::dropIfExists('note_group_targets');
        Schema::dropIfExists('notes');
    }
};
