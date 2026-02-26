<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Admin;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Admin\Academy\AddSecretaryRequest;
use App\Domains\Application\Services\Admin\AcademyService;
use App\Domains\Application\Http\Requests\Admin\Academy\StoreAcademyRequest;
use App\Domains\Application\Http\Requests\Admin\Academy\UpdateAcademyRequest;
use App\Domains\Application\Http\Requests\Admin\Academy\UpdatePlanRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AcademyController extends Controller
{
    public function __construct(
        private AcademyService $academyService
    ) {}

    /**
     * Get list of academies
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'status']);

        $academies = $this->academyService->getAcademies($perPage, $filters);

        return $this->successResponse(['academies' => $academies]);
    }

    /**
     * Create new academy
     */
    public function store(StoreAcademyRequest $request): JsonResponse
    {
        $academy = $this->academyService->create($request->validated());

        return $this->successResponse([
            'academy' => $academy,
        ], 'تم إنشاء الأكاديمية بنجاح', 201);
    }

    /**
     * Get academy details
     */
    public function show(string $id): JsonResponse
    {
        $academy = \App\Domains\Auth\Models\Academy::with(['teachers', 'secretaries', 'billings'])
            ->findOrFail($id);

        return $this->successResponse(['academy' => $academy]);
    }

    /**
     * Update academy
     */
    public function update(UpdateAcademyRequest $request, string $id): JsonResponse
    {
        $academy = \App\Domains\Auth\Models\Academy::findOrFail($id);
        $academy = $this->academyService->update($academy, $request->validated());

        return $this->successResponse([
            'academy' => $academy,
            'message' => 'تم تحديث الأكاديمية بنجاح',
        ]);
    }

    /**
     * Toggle academy status
     */
    public function toggleStatus(string $id): JsonResponse
    {
        $academy = \App\Domains\Auth\Models\Academy::findOrFail($id);
        $isActive = $this->academyService->toggleStatus($academy);

        return $this->successResponse([
            'message' => $isActive ? 'تم تفعيل الأكاديمية' : 'تم تعطيل الأكاديمية',
            'is_active' => $isActive,
        ]);
    }

    /**
     * Delete academy
     */
    public function destroy(string $id): JsonResponse
    {
        $academy = \App\Domains\Auth\Models\Academy::findOrFail($id);
        $this->academyService->delete($academy);

        return $this->successResponse(['message' => 'تم حذف الأكاديمية بنجاح']);
    }

    /**
     * Get academy secretaries
     */
    public function secretaries(string $id): JsonResponse
    {
        $academy = \App\Domains\Auth\Models\Academy::findOrFail($id);
        $secretaries = $academy->secretaries()->withPivot('permissions', 'is_active')->get();

        return $this->successResponse(['secretaries' => $secretaries]);
    }

    /**
     * Add secretary to academy
     */
    public function addSecretary(AddSecretaryRequest $request, string $id): JsonResponse
    {
        $academy = \App\Domains\Auth\Models\Academy::findOrFail($id);

        try {
            $secretary = $this->academyService->addSecretary(
                $academy,
                $request->validated()['secretary_id'],
                $request->validated()['permissions'] ?? []
            );

            return $this->successResponse([
                'secretary' => $secretary,
            ], 'تم إضافة السكرتير بنجاح', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Remove secretary from academy
     */
    public function removeSecretary(string $academyId, string $secretaryId): JsonResponse
    {
        $academy = \App\Domains\Auth\Models\Academy::findOrFail($academyId);
        $this->academyService->removeSecretary($academy, $secretaryId);

        return $this->successResponse(['message' => 'تم حذف السكرتير من الأكاديمية بنجاح']);
    }

    /**
     * Regenerate QR codes
     */
    public function regenerateQrCodes(string $id): JsonResponse
    {
        $academy = \App\Domains\Auth\Models\Academy::findOrFail($id);
        $academy = $this->academyService->regenerateQrCodes($academy);

        return $this->successResponse([
            'academy' => $academy,
            'message' => 'تم تجديد رموز QR بنجاح',
        ]);
    }

    /**
     * Update academy subscription plan (similar to teacher's updatePlan)
     */
    public function updatePlan(UpdatePlanRequest $request, string $id): JsonResponse
    {
        try {
            $academy = $this->academyService->setSubscriptionPlan($id, $request->validated());

            return $this->successResponse([
                'academy' => $academy,
            ], 'تم تحديث باقة الاشتراك بنجاح');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Get academy subscription for a specific month
     * Same as TeacherController::getSubscription
     */
    public function getSubscription(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'month' => 'required|string|size:7', // YYYY-MM format
        ]);

        $subscription = $this->academyService->getSubscriptionForMonth(
            $id,
            $request->month . '-01'
        );

        return $this->successResponse($subscription);
    }

    /**
     * Update academy subscription (record payment)
     * Same as TeacherController::updateSubscription
     */
    public function updateSubscription(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'month' => 'required|string|size:7', // YYYY-MM format
            'payment_amount' => 'required|numeric|min:0',
        ]);

        $subscription = $this->academyService->paySubscription(
            $id,
            $request->month . '-01',
            $request->payment_amount ?? 0
        );

        return $this->successResponse(
            $subscription,
            'تم تحديث بيانات الاشتراك بنجاح'
        );
    }

    /**
     * Get all academy subscriptions with pagination
     * Same as teacher subscriptions endpoint
     */
    public function subscriptions(Request $request, string $id): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 12);
        $subscriptions = $this->academyService->getAcademySubscriptions($id, $perPage);

        return $this->successResponse([
            'subscriptions' => $subscriptions,
        ]);
    }
}
