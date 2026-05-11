<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teachers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('phone')->unique();
            $table->string('subject')->nullable();
            $table->string('password');
            $table->string('avatar_key')->nullable();
            $table->string('status')->default(\App\Domains\Auth\Enums\TeacherStatus::PENDING->value);
            $table->boolean('is_independent_active')->default(true);
            
            // Subscription fields
            $table->unsignedSmallInteger('trial_period_days')->nullable();
            $table->string('plan_type')->nullable();
            $table->string('subscription_period')->nullable();
            $table->date('plan_expires_at')->nullable();
            $table->integer('plan_max_students')->nullable();
            $table->boolean('is_unlimited_students')->default(false);
            $table->decimal('subscription_fee', 10, 2)->default(0);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->unsignedInteger('storage_limit_gb')->nullable();
            $table->unsignedBigInteger('storage_used_bytes')->default(0);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->string('discount_type', 20)->default('percent');
            $table->string('discount_scope', 20)->default('general');
            $table->text('billing_notes')->nullable();

            $table->rememberToken();
            $table->timestamps();

            $table->index('phone');
            $table->index('plan_type');
            $table->index('plan_expires_at');
            $table->index('subscription_fee');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
