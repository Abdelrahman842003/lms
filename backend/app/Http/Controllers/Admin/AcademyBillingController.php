<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AcademyBillingService;
use App\Http\Requests\Admin\AcademyBilling\GenerateBillingRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class AcademyBillingController extends Controller
{
    public function __construct(
        private AcademyBillingService $billingService
    ) {}

    /**
     * Get list of billings
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['status', 'month', 'year', 'academy_id']);

        $billings = $this->billingService->getBillings($perPage, $filters);

        return $this->successResponse(['billings' => $billings]);
    }

    /**
     * Generate billing for academy
     */
    public function generate(GenerateBillingRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $billing = $this->billingService->generate(
                $validated['academy_id'],
                $validated['month'],
                $validated['year']
            );

            return $this->successResponse([
                'billing' => $billing->load('academy'),
            ], 'تم توليد الفاتورة بنجاح', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Get billing details
     */
    public function show(string $id): JsonResponse
    {
        $billing = \App\Models\AcademyBilling::with('academy')->findOrFail($id);

        return $this->successResponse(['billing' => $billing]);
    }

    /**
     * Update billing status
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $billing = \App\Models\AcademyBilling::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:pending,paid,cancelled',
            'notes' => 'nullable|string',
        ]);

        $billing = $this->billingService->updateStatus(
            $billing,
            $validated['status'],
            $validated['notes'] ?? null
        );

        return $this->successResponse([
            'billing' => $billing,
            'message' => 'تم تحديث حالة الفاتورة بنجاح',
        ]);
    }

    /**
     * Delete billing
     */
    public function destroy(string $id): JsonResponse
    {
        $billing = \App\Models\AcademyBilling::findOrFail($id);
        $this->billingService->delete($billing);

        return $this->successResponse(['message' => 'تم حذف الفاتورة بنجاح']);
    }

    /**
     * Get billing statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $year = (int) $request->input('year', Carbon::now()->year);
        $stats = $this->billingService->getStatistics($year);

        return $this->successResponse($stats);
    }
}
