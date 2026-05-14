<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('videos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('stream_uid', 64)->nullable()->unique()->comment('Cloudflare Stream video UID');

            $table->string('owner_type', 32);
            $table->uuid('owner_id');
            $table->string('uploader_type', 64)->nullable();
            $table->uuid('uploader_id')->nullable();

            $table->foreignUuid('teacher_reference_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->string('teacher_reference_name')->nullable();
            $table->uuid('academy_id')->nullable()->index();

            $table->foreignUuid('grade_id')->constrained('grades')->cascadeOnDelete();
            $table->foreignUuid('lecture_id')->nullable()->constrained('lectures')->nullOnDelete();
            $table->uuid('lesson_id')->nullable()->index();

            $table->string('title');
            $table->text('description')->nullable();

            $table->string('status', 32)->default('draft');
            $table->string('processing_status', 32)->default('pending');

            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable();

            $table->string('original_path')->nullable();
            $table->string('processed_path')->nullable();
            $table->string('thumbnail_path')->nullable();
            $table->string('video_mime')->nullable();
            $table->unsignedBigInteger('video_size_bytes')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('codec')->nullable();
            $table->decimal('frame_rate', 8, 3)->nullable();

            $table->string('published_by_type', 64)->nullable();
            $table->uuid('published_by_id')->nullable();
            $table->text('processing_error')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['owner_type', 'owner_id']);
            $table->index(['status', 'published_at']);
            $table->index(['academy_id', 'status']);
            $table->index(['teacher_reference_id', 'status']);
        });

        Schema::create('video_group_targets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('video_id')->constrained('videos')->cascadeOnDelete();
            $table->foreignUuid('group_id')->constrained('groups')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['video_id', 'group_id']);
        });

        Schema::create('video_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('video_id')->constrained('videos')->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size');
            $table->string('uploaded_by_type', 64)->nullable();
            $table->uuid('uploaded_by_id')->nullable();
            $table->timestamps();

            $table->index(['video_id', 'mime_type']);
        });

        Schema::create('video_access_grants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('video_id')->constrained('videos')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignUuid('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->foreignUuid('enrollment_id')->nullable()->constrained('enrollments')->nullOnDelete();
            $table->foreignUuid('granted_group_id')->nullable()->constrained('groups')->nullOnDelete();
            $table->timestamp('granted_at');
            $table->timestamp('revoked_at')->nullable();
            $table->string('revoked_reason')->nullable();
            $table->json('eligibility_snapshot')->nullable();
            $table->timestamps();

            $table->unique(['video_id', 'student_id']);
            $table->index(['student_id', 'revoked_at']);
            $table->index(['student_id', 'video_id'], 'vag_student_video_index');
            $table->index(['revoked_at'], 'vag_revoked_index');
        });

        Schema::create('video_watch_progresses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('video_id')->constrained('videos')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('status', 32)->default('not_started');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('last_watched_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('watched_seconds')->default(0);
            $table->decimal('watched_percentage', 5, 2)->default(0);
            $table->unsignedInteger('last_position_seconds')->default(0);
            $table->uuid('last_playback_token_id')->nullable();
            $table->timestamps();

            $table->unique(['video_id', 'student_id']);
            $table->index(['student_id', 'status']);
            $table->index(['student_id', 'video_id'], 'vwp_student_video_index');
        });

        Schema::create('video_likes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('video_id')->constrained('videos')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['video_id', 'student_id']);
        });

        Schema::create('video_comments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('video_id')->constrained('videos')->cascadeOnDelete();
            $table->foreignUuid('parent_id')->nullable()->constrained('video_comments')->cascadeOnDelete();
            $table->string('author_type', 64);
            $table->uuid('author_id');
            $table->text('body');
            $table->boolean('is_hidden')->default(false);
            $table->string('hidden_by_type', 64)->nullable();
            $table->uuid('hidden_by_id')->nullable();
            $table->timestamp('hidden_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['video_id', 'parent_id']);
            $table->index(['video_id', 'is_hidden']);
        });

        Schema::create('video_playback_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('video_id')->constrained('videos')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('device_fingerprint', 128);
            $table->string('session_identifier', 128)->nullable();
            $table->string('user_agent_hash', 64);
            $table->string('ip_address', 45)->nullable();
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('issued_at');
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->string('revoked_reason')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'expires_at']);
            $table->index(['student_id', 'device_fingerprint']);
            $table->index(['video_id', 'student_id']);
        });

        Schema::create('video_access_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('video_id')->nullable()->index();
            $table->uuid('student_id')->nullable()->index();
            $table->string('action', 64);
            $table->string('result', 32);
            $table->string('reason')->nullable();
            $table->string('device_fingerprint', 128)->nullable();
            $table->string('session_identifier', 128)->nullable();
            $table->string('user_agent_hash', 64)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['action', 'result', 'created_at']);
        });

        Schema::create('video_reminders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('video_id')->constrained('videos')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignUuid('guardian_id')->nullable()->constrained('guardians')->nullOnDelete();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('next_reminder_at')->nullable();
            $table->timestamp('last_reminded_at')->nullable();
            $table->timestamp('stopped_at')->nullable();
            $table->string('stop_reason')->nullable();
            $table->timestamps();

            $table->unique(['video_id', 'student_id']);
            $table->index(['next_reminder_at', 'stopped_at']);
            $table->index(['next_reminder_at', 'stopped_at'], 'vr_pending_index');
            $table->index(['student_id', 'video_id'], 'vr_student_video_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_reminders');
        Schema::dropIfExists('video_access_logs');
        Schema::dropIfExists('video_playback_tokens');
        Schema::dropIfExists('video_comments');
        Schema::dropIfExists('video_likes');
        Schema::dropIfExists('video_watch_progresses');
        Schema::dropIfExists('video_access_grants');
        Schema::dropIfExists('video_attachments');
        Schema::dropIfExists('video_group_targets');
        Schema::dropIfExists('videos');
    }
};
