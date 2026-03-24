<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\Subscription\RequestRenewalRequest;
use App\Domains\Subscriptions\Services\SubscriptionRenewalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    use \App\Domains\Application\Traits\ResolvesAcademy;

    public function __construct(private SubscriptionRenewalService $renewalService) {}

    public function show(Request $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (! $academy) {
            return $this->errorResponse('الأكاديمية غير موجودة', 404);
        }

        $pending = $this->renewalService->getPendingRenewal($academy);

        return $this->successResponse([
            'subscription' => $this->renewalService->getSubscriptionSnapshot($academy),
            'plan_options' => $this->renewalService->planOptions(),
            'pending_request' => $pending ? [
                'id' => $pending->id,
                'month' => $pending->month?->format('Y-m-d'),
                'amount_due' => (float) $pending->amount_due,
                'status' => $pending->status?->value ?? (string) $pending->status,
                'notes' => $pending->notes,
                'created_at' => $pending->created_at?->format('Y-m-d H:i'),
            ] : null,
        ]);
    }

    public function requestRenewal(RequestRenewalRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (! $academy) {
            return $this->errorResponse('الأكاديمية غير موجودة', 404);
        }

        $validated = $request->validated();
        $planSelection = (string) ($validated['plan_selection'] ?? '');
        $customMonths = isset($validated['custom_months']) ? (int) $validated['custom_months'] : null;

        $subscription = $this->renewalService->createRenewalRequest($academy, $planSelection, $customMonths);

        return $this->successResponse([
            'subscription_id' => $subscription->id,
            'status' => $subscription->status?->value ?? (string) $subscription->status,
        ], 'تم إرسال طلب التجديد بنجاح');
    }
}
