<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\PaymentLog;
use App\Models\Enrollment;
use App\Models\SyncError;
use App\Services\Teacher\PaymentLogService;
use App\Http\Requests\Teacher\PaymentLog\StorePaymentRequest;
use App\Http\Requests\Teacher\PaymentLog\SyncPaymentRequest;
use Illuminate\Http\Request;

class PaymentLogController extends Controller
{
    use \App\Traits\ResolvesTeacher;
    
    protected $paymentService;

    public function __construct(PaymentLogService $paymentService)
    {
        $this->paymentService = $paymentService;
    }
    /**
     * List all payments for the teacher
     */
    public function index(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = $request->input('per_page', 20);
        $filters = $request->only(['status', 'search']);

        $payments = $this->paymentService->getPayments($teacher, $perPage, $filters);

        return $this->successResponse([
            'payments' => $payments,
        ]);
    }

    /**
     * Get pending payments awaiting student confirmation
     */
    public function pending(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        $payments = $this->paymentService->getPending($teacher);

        return $this->successResponse([
            'payments' => $payments,
        ]);
    }

    /**
     * Record a new payment (single)
     */
    public function store(StorePaymentRequest $request)
    {
        $validated = $request->validated();

        $teacher = $this->getTeacherFromRequest($request);

        try {
            $result = $this->paymentService->createPayment($teacher, $validated);
            
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
    public function syncBatch(SyncPaymentRequest $request)
    {
        $validated = $request->validated();

        $teacher = $this->getTeacherFromRequest($request);
        $results = $this->paymentService->syncBatch($teacher, $validated['payments']);

        return $this->successResponse($results);
    }

    /**
     * Show payment details
     */
    public function show(Request $request, string $id)
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
    public function cancel(Request $request, string $id)
    {
        $teacher = $this->getTeacherFromRequest($request);

        try {
            $this->paymentService->cancel($teacher, $id);
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
    public function statistics(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        $stats = $this->paymentService->getStatistics($teacher);

        return $this->successResponse($stats);
    }
}
