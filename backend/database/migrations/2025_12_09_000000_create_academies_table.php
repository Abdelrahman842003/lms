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
            $table->unsignedSmallInteger('trial_period_days')->nullable()->comment('Custom trial period in days for academy enrollments');
            $table->string('plan_type')->nullable()->comment('trial, fixed, custom');
            $table->string('subscription_period')->nullable()->comment('monthly, quarterly, semi_annual, annual, trial, custom');
            $table->date('plan_expires_at')->nullable();
            $table->integer('plan_max_students')->nullable()->comment('Maximum number of students allowed');
            $table->unsignedInteger('storage_limit_gb')->nullable()->comment('الحد الأقصى للتخزين بالجيجا. null = غير محدود');
            $table->unsignedBigInteger('storage_used_bytes')->default(0)->comment('إجمالي التخزين المستخدم بالبايت (فيديوهات + مرفقات)');
            $table->boolean('is_unlimited_students')->default(false);
            $table->decimal('subscription_fee', 10, 2)->default(0);
            $table->decimal('discount_percent', 5, 2)->default(0)->comment('نسبة الخصم المطبقة على رسوم الاشتراك (0-100)');
            $table->string('discount_type', 20)->default('percent')->comment('نوع الخصم: percent أو fixed');
            $table->string('discount_scope', 20)->default('general')->comment('نطاق الخصم: general أو students أو storage');
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->text('billing_notes')->nullable();
            $table->timestamps();
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
