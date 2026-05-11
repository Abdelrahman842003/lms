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

            // R2 multipart identifiers
            $table->string('r2_upload_id', 512);       // UploadId from createMultipartUpload
            $table->string('object_key', 1024);         // The R2 object key (path)
            $table->string('file_fingerprint', 512)->nullable()->index();

            // File metadata declared at initiation (not trusted blindly)
            $table->string('declared_filename', 512)->nullable();
            $table->string('declared_mime', 128)->nullable();
            $table->unsignedBigInteger('declared_size_bytes')->nullable();
            $table->unsignedInteger('total_parts')->nullable();

            // Status lifecycle: draft → uploading → completing → completed | aborted | failed
            $table->string('status', 32)->default('draft')->index();

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

        Schema::create('video_upload_parts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('session_id')->constrained('video_upload_sessions')->cascadeOnDelete();
            
            $table->unsignedInteger('part_number');
            $table->unsignedBigInteger('size_bytes');
            $table->string('status', 32)->default('pending'); // pending, uploaded, failed
            $table->string('etag', 512)->nullable();
            $table->unsignedTinyInteger('upload_attempts')->default(0);

            $table->timestamps();

            $table->unique(['session_id', 'part_number']);
            $table->index(['session_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_upload_parts');
        Schema::dropIfExists('video_upload_sessions');
    }
};
