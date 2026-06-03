<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Services;

use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Subscriptions\Models\PaymentTransaction;
use App\Domains\Subscriptions\Models\PricingPackage;
use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Subscriptions\Enums\PaymentTransactionStatus;
use App\Domains\Application\Models\Setting;
use App\Domains\Subscriptions\Events\PaymentTransactionCreated;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Exception;

class SelfServiceSubscriptionService
{
    public function __construct(
        private readonly PaymentGatewayService $gatewayService
    ) {}

    public function initiateSubscription(
        Model $subscriber,
        PricingPackage $package,
        string $planType,
        string $paymentMethod,
        array $payerDetails = []
    ): array {
        $month = $this->resolveRequestMonth($subscriber);

        // Check if there is already a pending or paid subscription for the target month
        $existing = Subscription::where('subscriber_id', $subscriber->id)
            ->where('subscriber_type', get_class($subscriber))
            ->where('month', $month->toDateString())
            ->whereIn('status', [SubscriptionStatus::PENDING->value, SubscriptionStatus::PAID->value, SubscriptionStatus::ACTIVE->value])
            ->first();

        if ($existing) {
            throw new Exception('لديك بالفعل طلب اشتراك معلق أو مفعل لهذا الشهر. يرجى مراجعة الاشتراكات السابقة.');
        }

        // Calculate amount due based on plan type and package price
        $amountDue = $this->calculateAmountDue($package, $planType);
        $months = $this->getMonthsForPlanType($planType);

        $label = match ($planType) {
            'monthly' => 'شهري (1 شهر)',
            'quarterly' => 'ربع سنوي (3 شهور)',
            'semi_annual' => 'نصف سنوي (6 شهور)',
            'annual' => 'سنوي (1 سنة)',
            default => 'شهري (1 شهر)',
        };

        $notes = implode("\n", [
            "نوع الطلب: تجديد دفع ذاتي",
            "نوع الاشتراك: {$label}",
            "الباقة: {$package->name_ar}",
            "عدد الشهور: {$months}",
            "مساحة التخزين المتاحة: " . ($package->storage_minutes ?? 0) . " دقيقة",
            "سعة الطلاب المتاحة: " . ($package->max_students ?? 0),
        ]);

        // Create subscription
        $subscription = Subscription::create([
            'subscriber_id' => $subscriber->id,
            'subscriber_type' => get_class($subscriber),
            'type' => $subscriber instanceof \App\Domains\Auth\Models\Academy ? 'academy' : 'teacher',
            'month' => $month->toDateString(),
            'seats_count' => $package->max_students ?? 0,
            'quota_limit' => $package->max_students,
            'cost_per_seat' => 0.00,
            'amount_due' => $amountDue,
            'amount_paid' => 0.00,
            'status' => SubscriptionStatus::PENDING->value,
            'notes' => $notes,
            'request_type' => 'renewal',
            'upgrade_seats_from' => null,
            'upgrade_seats_to' => $package->max_students,
            'upgrade_storage_from_gb' => null,
            'upgrade_storage_to_gb' => $package->storage_minutes,
        ]);

        // Create payment intent transaction via gateway
        $transaction = $this->gatewayService->createPaymentIntent(
            $subscriber,
            $subscription,
            $paymentMethod,
            $payerDetails
        );

        // Trigger Event
        event(new PaymentTransactionCreated($transaction));

        return [$subscription, $transaction];
    }

    public function uploadPaymentProof(PaymentTransaction $transaction, UploadedFile $file): PaymentTransaction
    {
        if (!$transaction->isPending()) {
            throw new Exception('لا يمكن رفع إيصال دفع لعملية غير معلقة.');
        }

        // Upload to R2 storage
        $path = Storage::disk('r2')->putFile('proofs', $file);
        
        $transaction->update([
            'proof_image_key' => $path,
        ]);

        return $transaction;
    }

    public function getPaymentMethods(): array
    {
        $instapayEnabled = (bool) Setting::getValue('instapay_receiver_number');
        $vodafoneEnabled = (bool) Setting::getValue('vodafone_cash_receiver_number');

        $methods = [];

        if ($instapayEnabled) {
            $methods[] = [
                'id' => 'instapay',
                'name_ar' => 'إنستاباي (InstaPay)',
                'receiver_number' => Setting::getValue('instapay_receiver_number'),
                'receiver_name' => Setting::getValue('instapay_receiver_name', 'منصة نطاق التعليمية'),
                'instructions' => Setting::getValue('payment_instructions_ar'),
            ];
        }

        if ($vodafoneEnabled) {
            $methods[] = [
                'id' => 'vodafone_cash',
                'name_ar' => 'فودافون كاش (Vodafone Cash)',
                'receiver_number' => Setting::getValue('vodafone_cash_receiver_number'),
                'instructions' => Setting::getValue('payment_instructions_ar'),
            ];
        }

        return $methods;
    }

    private function resolveRequestMonth(Model $subscriber): Carbon
    {
        $expiresAt = data_get($subscriber, 'plan_expires_at');
        if ($expiresAt) {
            $date = Carbon::parse($expiresAt)->startOfDay()->addDay();
            if ($date->greaterThan(now())) {
                return $date->copy()->startOfMonth();
            }
        }

        return Carbon::today()->startOfMonth();
    }

    private function calculateAmountDue(PricingPackage $package, string $planType): float
    {
        return match ($planType) {
            'monthly' => (float) $package->price,
            'quarterly' => (float) ($package->price * 3),
            'semi_annual' => (float) $package->half_yearly_price,
            'annual' => (float) $package->yearly_price,
            default => (float) $package->price,
        };
    }

    private function getMonthsForPlanType(string $planType): int
    {
        return match ($planType) {
            'monthly' => 1,
            'quarterly' => 3,
            'semi_annual' => 6,
            'annual' => 12,
            default => 1,
        };
    }
}
