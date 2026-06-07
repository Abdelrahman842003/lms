<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sent_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('teacher_profile_id')->nullable()->constrained('teacher_profiles')->onDelete('cascade');
            $table->foreignUuid('admin_id')->nullable()->constrained('admins')->onDelete('cascade');
            $table->foreignUuid('student_id')->nullable()->constrained('students')->onDelete('cascade');
            $table->string('title');
            $table->text('message');
            $table->string('recipient_type'); // all, grade, group, admin
            $table->integer('recipient_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sent_notifications');
    }
};
