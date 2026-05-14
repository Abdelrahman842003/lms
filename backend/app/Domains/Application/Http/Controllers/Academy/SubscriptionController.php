<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\Subscription\RequestRenewalRequest;
use App\Domains\Subscriptions\Services\SubscriptionRenewalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

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
                'request_type' => $pending->request_type,
                'notes' => $pending->notes,
                'upgrade_seats_from' => $pending->upgrade_seats_from,
                'upgrade_seats_to' => $pending->upgrade_seats_to,
                'upgrade_storage_minutes_from' => $pending->upgrade_storage_from_gb, // Using field for minutes
                'upgrade_storage_minutes_to' => $pending->upgrade_storage_to_gb, // Using field for minutes
                'upgrade_price_difference' => (float) ($pending->upgrade_price_difference ?? 0),
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
        $upgradePayload = [
            'upgrade_seats' => (bool) ($validated['upgrade_seats'] ?? false),
            'upgrade_storage' => (bool) ($validated['upgrade_storage'] ?? false),
            'new_seats_limit' => isset($validated['new_seats_limit']) ? (int) $validated['new_seats_limit'] : null,
            'new_storage_minutes_limit' => isset($validated['new_storage_minutes_limit']) ? (int) $validated['new_storage_minutes_limit'] : null,
            'new_delivery_minutes_limit' => isset($validated['new_delivery_minutes_limit']) ? (int) $validated['new_delivery_minutes_limit'] : null,
        ];

        try {
            $subscription = $this->renewalService->createRenewalRequest($academy, $planSelection, $customMonths, $upgradePayload);
        } catch (InvalidArgumentException $exception) {
            return $this->errorResponse($exception->getMessage(), 422);
        }

        $isUpgradeRequest = (bool) ($upgradePayload['upgrade_seats'] ?? false) || (bool) ($upgradePayload['upgrade_storage'] ?? false);

        return $this->successResponse([
            'subscription_id' => $subscription->id,
            'status' => $subscription->status?->value ?? (string) $subscription->status,
        ], $isUpgradeRequest ? 'تم إرسال طلب الترقية بنجاح' : 'تم إرسال طلب التجديد بنجاح');
    }
}
