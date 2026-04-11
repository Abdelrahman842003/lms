<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Unified subscriptions table for both teachers and academies
     * Uses polymorphic relationship for subscriber (teacher or academy)
     */
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Polymorphic relationship for subscriber (teacher or academy)
            $table->uuid('subscriber_id');
            $table->string('subscriber_type'); // App\Models\Teacher or App\Models\Academy
            
            // Subscription type
            $table->string('type'); // teacher or academy (from SubscriptionType enum)
            
            // Period
            $table->date('month'); // Stored as YYYY-MM-01 (first day of month)
            
            // Count metrics
            $table->integer('seats_count')->default(0); // Number of seats (students for teacher, enrollments for academy)
            $table->integer('quota_limit')->nullable(); // Max quota (null = unlimited)
            
            // Financial
            $table->decimal('cost_per_seat', 10, 2)->default(0);
            $table->decimal('amount_due', 10, 2)->default(0);
            $table->decimal('amount_paid', 10, 2)->default(0);
            
            // Status
            $table->string('status')->default(\App\Domains\Subscriptions\Enums\SubscriptionStatus::PENDING->value);
            
            // Payment tracking
            $table->string('payment_key', 20)->nullable()->unique();
            $table->timestamp('payment_initiated_at')->nullable();
            $table->string('payment_method')->nullable();
            $table->date('paid_at')->nullable();
            
            // Notes
            $table->text('notes')->nullable();
            
            $table->string('request_type')->default('renewal');

            $table->unsignedInteger('upgrade_seats_from')->nullable();
            $table->unsignedInteger('upgrade_seats_to')->nullable();
            $table->unsignedInteger('upgrade_storage_from_gb')->nullable();
            $table->unsignedInteger('upgrade_storage_to_gb')->nullable();
            $table->decimal('upgrade_price_difference', 10, 2)->default(0);

            $table->timestamp('upgrade_reviewed_at')->nullable();
            $table->uuid('upgrade_reviewed_by')->nullable();
            $table->text('upgrade_rejection_reason')->nullable();

            $table->timestamps();

            // Unique constraint to prevent duplicate subscriptions for same subscriber/month
            $table->unique(['subscriber_id', 'subscriber_type', 'month']);
            
            // Indexes for performance
            $table->index(['subscriber_type', 'status']);
            $table->index(['month', 'status']);
            $table->index(['request_type', 'status'], 'subscriptions_request_type_status_idx');
        });

        // Enforce seats_count <= quota_limit at DB level when quota is المحدد
        try {
            DB::statement(
                'ALTER TABLE subscriptions
                 ADD CONSTRAINT chk_subscriptions_seats_lte_quota
                 CHECK (quota_limit IS NULL OR seats_count <= quota_limit)'
            );
        } catch (\Throwable) {
            // Keep migration portable in case DB engine/version does not support named CHECK constraints.
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
