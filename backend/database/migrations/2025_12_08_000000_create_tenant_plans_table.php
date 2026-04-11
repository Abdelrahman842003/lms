<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('tenant'); // tenant_id & tenant_type (Academy or Teacher)
            
            // Plan Details
            $table->unsignedSmallInteger('trial_period_days')->nullable()->comment('Custom trial period in days');
            $table->string('plan_type')->nullable()->comment('trial, fixed, custom');
            $table->string('subscription_period')->nullable()->comment('monthly, quarterly, semi_annual, annual, trial, custom');
            $table->date('plan_expires_at')->nullable();
            $table->integer('plan_max_students')->nullable()->comment('Maximum number of students allowed');
            
            // Storage
            $table->unsignedInteger('storage_limit_gb')->nullable()->comment('Max storage in GB. null = unlimited');
            $table->unsignedBigInteger('storage_used_bytes')->default(0)->comment('Total used storage in bytes');
            
            // Logic Flags
            $table->boolean('is_unlimited_students')->default(false);
            
            
            // Financials (Initial/Current state)
            $table->decimal('subscription_fee', 10, 2)->default(0);
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->string('discount_type', 20)->default('percent');
            $table->string('discount_scope', 20)->default('general');
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->text('billing_notes')->nullable();
            
            $table->timestamps();
            
            $table->index(['tenant_id', 'tenant_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_plans');
    }
};
