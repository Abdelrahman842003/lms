<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Subscription\InitiatePaymentRequest;
use App\Domains\Subscriptions\Services\SelfServiceSubscriptionService;
use App\Domains\Subscriptions\Models\PricingPackage;
use App\Domains\Subscriptions\Models\PaymentTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class SubscriptionPaymentController extends Controller
{
    use \App\Domains\Application\Traits\ResolvesTeacher;

    public function __construct(
        private readonly SelfServiceSubscriptionService $subscriptionService
    ) {}

    public function methods(Request $request): JsonResponse
    {
        return $this->successResponse([
            'methods' => $this->subscriptionService->getPaymentMethods()
        ]);
    }

    public function packages(Request $request): JsonResponse
    {
        $packages = PricingPackage::active()->get();
        return $this->successResponse([
            'packages' => $packages
        ]);
    }

    public function initiate(InitiatePaymentRequest $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        if (!$teacher) {
            return $this->errorResponse('المعلم غير موجود', 404);
        }

        $validated = $request->validated();
        $package = PricingPackage::find($validated['package_id']);
        
        try {
            [$subscription, $transaction] = $this->subscriptionService->initiateSubscription(
                $teacher,
                $package,
                $validated['plan_type'],
                $validated['payment_method'],
                [
                    'sender_phone' => $validated['sender_phone'] ?? null,
                    'sender_name' => $validated['sender_name'] ?? null,
                ]
            );

            return $this->successResponse([
                'subscription_id' => $subscription->id,
                'payment_key' => $transaction->payment_key,
                'amount' => (float) $transaction->amount,
                'expires_at' => $transaction->expires_at?->format('Y-m-d H:i:s'),
                'methods' => $this->subscriptionService->getPaymentMethods(),
            ], 'تم إنشاء طلب الاشتراك بنجاح. يرجى تحويل المبلغ ورفع الإثبات.');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function uploadProof(string $paymentKey, Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        if (!$teacher) {
            return $this->errorResponse('المعلم غير موجود', 404);
        }

        $request->validate([
            'proof_image' => ['required', 'file', 'image', 'max:5120'], // 5MB
        ]);

        $transaction = PaymentTransaction::where('payment_key', $paymentKey)
            ->where('payer_id', $teacher->id)
            ->first();

        if (!$transaction) {
            return $this->errorResponse('عملية الدفع غير موجودة.', 404);
        }

        try {
            $file = $request->file('proof_image');
            $this->subscriptionService->uploadPaymentProof($transaction, $file);

            return $this->successResponse([
                'payment_key' => $transaction->payment_key,
                'status' => $transaction->status->value,
            ], 'تم رفع إيصال التحويل بنجاح وبانتظار تأكيد الإدارة.');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function status(string $paymentKey, Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        if (!$teacher) {
            return $this->errorResponse('المعلم غير موجود', 404);
        }

        $transaction = PaymentTransaction::where('payment_key', $paymentKey)
            ->where('payer_id', $teacher->id)
            ->with('subscription')
            ->first();

        if (!$transaction) {
            return $this->errorResponse('عملية الدفع غير موجودة.', 404);
        }

        return $this->successResponse([
            'payment_key' => $transaction->payment_key,
            'status' => $transaction->status->value,
            'status_label' => $transaction->status->label(),
            'amount' => (float) $transaction->amount,
            'payment_method' => $transaction->payment_method->value,
            'payment_method_label' => $transaction->payment_method->label(),
            'sender_name' => $transaction->sender_name,
            'sender_phone' => $transaction->sender_phone,
            'created_at' => $transaction->created_at?->format('Y-m-d H:i:s'),
            'expires_at' => $transaction->expires_at?->format('Y-m-d H:i:s'),
            'rejection_reason' => $transaction->rejection_reason,
            'admin_notes' => $transaction->admin_notes,
            'proof_uploaded' => !empty($transaction->proof_image_key),
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        if (!$teacher) {
            return $this->errorResponse('المعلم غير موجود', 404);
        }

        $transactions = PaymentTransaction::where('payer_id', $teacher->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($t) => [
                'payment_key' => $t->payment_key,
                'status' => $t->status->value,
                'status_label' => $t->status->label(),
                'amount' => (float) $t->amount,
                'payment_method' => $t->payment_method->value,
                'payment_method_label' => $t->payment_method->label(),
                'created_at' => $t->created_at?->format('Y-m-d H:i'),
                'expires_at' => $t->expires_at?->format('Y-m-d H:i'),
            ]);

        return $this->successResponse([
            'history' => $transactions
        ]);
    }
}
