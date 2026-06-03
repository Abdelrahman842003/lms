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
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // Polymorphic relation to Teacher/Academy
            $table->uuid('payer_id');
            $table->string('payer_type');
            
            // Link to subscription
            $table->uuid('subscription_id')->nullable();
            $table->foreign('subscription_id')->references('id')->on('subscriptions')->nullOnDelete();
            
            // Payment details
            $table->string('payment_key', 20)->unique(); // TXN-XXXXXXXX
            $table->string('gateway', 50)->default('ManualTransfer'); // Omnipay gateway name
            $table->string('gateway_reference', 100)->nullable(); // Omnipay transaction reference
            $table->string('payment_method', 30); // instapay, vodafone_cash, admin
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('EGP');
            $table->string('description')->nullable();
            
            // Payer info for verification
            $table->string('sender_phone', 20)->nullable();
            $table->string('sender_name', 100)->nullable();
            $table->string('proof_image_key')->nullable(); // Storage key
            
            // Status tracking
            $table->string('status', 20)->default('pending'); // pending, confirmed, rejected, expired
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->uuid('confirmed_by')->nullable(); // admin UUID
            $table->timestamp('rejected_at')->nullable();
            $table->string('rejection_reason')->nullable();
            $table->text('admin_notes')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index(['payer_id', 'payer_type']);
            $table->index(['status', 'created_at']);
            $table->index(['payment_method', 'status']);
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
