<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sent_notifications', function (Blueprint $table) {
            $table->boolean('is_voice')->default(false)->after('recipient_count');
            $table->string('voice_path')->nullable()->after('is_voice');
            $table->integer('voice_duration')->nullable()->after('voice_path'); // in seconds
        });
    }

    public function down(): void
    {
        Schema::table('sent_notifications', function (Blueprint $table) {
            $table->dropColumn(['is_voice', 'voice_path', 'voice_duration']);
        });
    }
};
