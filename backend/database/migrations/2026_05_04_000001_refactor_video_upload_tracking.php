<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update video_upload_sessions
        Schema::table('video_upload_sessions', function (Blueprint $table) {
            $table->string('file_fingerprint', 512)->nullable()->after('video_id')->index();
            // Status was already modified in the Enum file, but let's ensure the DB default is updated if needed
            // However, the migration that created it used 'pending_upload' which is now gone.
            // We should ideally update existing records or at least the default.
            $table->string('status', 32)->default('draft')->change();
        });

        // 2. Create video_upload_parts
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
        
        Schema::table('video_upload_sessions', function (Blueprint $table) {
            $table->dropColumn('file_fingerprint');
            $table->string('status', 32)->default('pending_upload')->change();
        });
    }
};
