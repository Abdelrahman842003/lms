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
        Schema::create('academy_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('academy_id')->constrained('academies')->onDelete('cascade');
            $table->foreignUuid('created_by')->nullable()->constrained('secretaries')->onDelete('set null');
            $table->string('title');
            $table->text('message');
            $table->string('type')->default(\App\Domains\Notifications\Enums\NotificationType::INFO->value);
            $table->string('target_type')->default(\App\Domains\Notifications\Enums\NotificationTargetType::ALL->value);
            $table->json('read_by')->nullable(); // Array of user IDs who read the notification
            $table->timestamps();

            // Index for faster queries
            $table->index(['academy_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academy_notifications');
    }
};
