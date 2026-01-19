<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\PaymentLog\StorePaymentRequest;
use App\Http\Requests\Teacher\PaymentLog\SyncPaymentRequest;
use App\Models\PaymentLog;
use App\Services\Teacher\PaymentLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentLogController extends Controller
{
    use \App\Traits\ResolvesTeacher;

    public function __construct(
        private PaymentLogService $service
    ) {}

    /**
     * List all payments for the teacher
     */
    public function index(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = (int) $request->input('per_page', 20);
        $filters = $request->only(['status', 'search']);

        $payments = $this->service->getPayments($teacher, $perPage, $filters);

        return $this->successResponse([
            'payments' => $payments,
        ]);
    }

    /**
     * Get pending payments awaiting student confirmation
     */
    public function pending(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $payments = $this->service->getPending($teacher);

        return $this->successResponse([
            'payments' => $payments,
        ]);
    }

    /**
     * Record a new payment (single)
     */
    public function store(StorePaymentRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $teacher = $this->getTeacherFromRequest($request);

        try {
            $result = $this->service->createPayment($teacher, $validated);
            
            if ($result['is_duplicate'] ?? false) {
                return $this->successResponse($result);
            }

            return $this->successResponse($result, 'تم تسجيل الدفعة بنجاح', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Batch sync offline payments (max 50 per request)
     */
    public function syncBatch(SyncPaymentRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $teacher = $this->getTeacherFromRequest($request);
        
        $results = $this->service->syncBatch($teacher, $validated['payments']);

        return $this->successResponse($results);
    }

    /**
     * Show payment details
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);

        $payment = PaymentLog::forTeacher($teacher->id)
            ->with(['student:id,name,phone', 'enrollment'])
            ->findOrFail($id);

        return $this->successResponse([
            'payment' => $payment,
        ]);
    }

    /**
     * Cancel a pending payment
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);

        try {
            $this->service->cancel($teacher, $id);
            return $this->successResponse([
                'message' => 'تم إلغاء الدفعة بنجاح',
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to cancel payment', 400);
        }
    }

    /**
     * Get payment statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $stats = $this->service->getStatistics($teacher);

        return $this->successResponse($stats);
    }
}
