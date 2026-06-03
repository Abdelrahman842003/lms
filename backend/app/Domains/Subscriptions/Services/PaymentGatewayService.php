<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Services;

use App\Domains\Subscriptions\Models\PaymentTransaction;
use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Subscriptions\Enums\PaymentTransactionStatus;
use App\Domains\Subscriptions\Enums\PaymentMethod;
use App\Domains\Subscriptions\Gateways\ManualTransfer\Gateway as ManualGateway;
use App\Domains\Application\Models\Setting;
use App\Domains\Auth\Models\Admin;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class PaymentGatewayService
{
    public function __construct(
        private readonly SubscriptionActivationService $activationService
    ) {}

    public function createPaymentIntent(
        Model $payer,
        Subscription $subscription,
        string $paymentMethod,
        array $metadata = []
    ): PaymentTransaction {
        $gateway = new ManualGateway();
        
        $response = $gateway->purchase([
            'amount' => $subscription->amount_due,
            'currency' => 'EGP',
            'description' => "Subscription #{$subscription->payment_key}",
            'paymentMethod' => $paymentMethod,
        ])->send();

        $expiryHours = (int) Setting::getValue('payment_expiry_hours', 48);

        return PaymentTransaction::create([
            'payer_id' => $payer->id,
            'payer_type' => get_class($payer),
            'subscription_id' => $subscription->id,
            'gateway' => 'ManualTransfer',
            'gateway_reference' => $response->getTransactionReference(),
            'payment_method' => $paymentMethod,
            'amount' => $subscription->amount_due,
            'currency' => 'EGP',
            'description' => $subscription->notes ? substr($subscription->notes, 0, 255) : "اشتراك",
            'sender_phone' => $metadata['sender_phone'] ?? null,
            'sender_name' => $metadata['sender_name'] ?? null,
            'status' => PaymentTransactionStatus::PENDING,
            'expires_at' => now()->addHours($expiryHours),
        ]);
    }

    public function confirmPayment(
        PaymentTransaction $transaction,
        Admin $admin,
        ?string $notes = null
    ): void {
        DB::transaction(function () use ($transaction, $admin, $notes) {
            $transaction->update([
                'status' => PaymentTransactionStatus::CONFIRMED,
                'confirmed_at' => now(),
                'confirmed_by' => $admin->id,
                'admin_notes' => $notes,
            ]);

            // Activate subscription
            $this->activationService->activate(
                $transaction->subscription,
                $transaction->payment_method->value
            );
        });

        event(new \App\Domains\Subscriptions\Events\PaymentConfirmed($transaction));
    }

    public function rejectPayment(
        PaymentTransaction $transaction,
        Admin $admin,
        string $reason
    ): void {
        $transaction->update([
            'status' => PaymentTransactionStatus::REJECTED,
            'rejected_at' => now(),
            'confirmed_by' => $admin->id,
            'rejection_reason' => $reason,
        ]);

        event(new \App\Domains\Subscriptions\Events\PaymentRejected($transaction));
    }
}
