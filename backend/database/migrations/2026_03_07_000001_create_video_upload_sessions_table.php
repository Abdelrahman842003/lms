<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_upload_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // The video record created at initiation
            $table->foreignUuid('video_id')->constrained('videos')->cascadeOnDelete();

            // Who initiated the upload
            $table->string('uploader_type', 64);
            $table->uuid('uploader_id');

            // Cloudflare Stream identifiers (TUS protocol)
            $table->string('stream_uid', 64)->nullable()->index()->comment('Cloudflare Stream video UID');
            $table->string('tus_upload_url', 2048)->nullable()->comment('TUS direct upload URL from Stream');

            // File fingerprint for deduplication / resume detection
            $table->string('file_fingerprint', 512)->nullable()->index();

            // File metadata declared at initiation
            $table->string('declared_filename', 512)->nullable();
            $table->string('declared_mime', 128)->nullable();
            $table->unsignedBigInteger('declared_size_bytes')->nullable();

            // Status lifecycle: uploading → completed | aborted | failed
            $table->string('status', 32)->default('uploading')->index();

            // Timestamps for audit
            $table->timestamp('initiated_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('aborted_at')->nullable();
            $table->string('abort_reason')->nullable();

            // IP for audit
            $table->string('initiator_ip', 45)->nullable();

            $table->timestamps();

            $table->index(['uploader_type', 'uploader_id']);
            $table->index(['video_id', 'status']);
            $table->index('created_at');
        });
        // Note: video_upload_parts table is intentionally NOT created.
        // TUS protocol handles chunking internally on Cloudflare Stream.
    }

    public function down(): void
    {
        Schema::dropIfExists('video_upload_sessions');
    }
};
