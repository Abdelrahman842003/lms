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
        Schema::create('academies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('phone')->unique();
            $table->string('password');
            $table->string('logo_key')->nullable();
            $table->string('checkin_qr_code')->unique();
            $table->string('checkout_qr_code')->unique();
            $table->boolean('is_active')->default(true);
            
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

            $table->timestamps();

            $table->index('plan_type');
            $table->index('plan_expires_at');
            $table->index('subscription_fee');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academies');
    }
};
