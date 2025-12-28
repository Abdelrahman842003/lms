<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\PaymentLog;
use App\Models\Enrollment;
use App\Models\SyncError;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentLogController extends Controller
{
    use \App\Traits\ResolvesTeacher;
    /**
     * List all payments for the teacher
     */
    public function index(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = $request->input('per_page', 20);

        $query = PaymentLog::forTeacher($teacher->id)
            ->with('student:id,name,phone');

        // Filter by status
        if ($request->filled('status')) {
            if ($request->status === 'expired') {
                $query->expired();
            } else {
                $query->where('status', $request->status);
            }
        }

        // Search by student name or phone
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $payments = $query->latest()->paginate($perPage);

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

        $payments = PaymentLog::pending()
            ->forTeacher($teacher->id)
            ->with('student:id,name,phone')
            ->latest()
            ->get();

        return $this->successResponse([
            'payments' => $payments,
        ]);
    }

    /**
     * Record a new payment (single)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|uuid|exists:students,id',
            'amount' => 'required|numeric|min:1',
            'notes' => 'nullable|string|max:500',
            'client_side_uuid' => 'required|uuid',
        ]);

        $teacher = $this->getTeacherFromRequest($request);

        // Idempotency check
        $existing = PaymentLog::where('client_side_uuid', $validated['client_side_uuid'])->first();
        if ($existing) {
            return $this->successResponse([
                'payment' => $existing,
                'confirmation_code' => $existing->confirmation_code,
                'message' => 'الدفعة مسجلة مسبقاً',
                'is_duplicate' => true,
            ]);
        }

        // Find enrollment
        $enrollment = Enrollment::where('student_id', $validated['student_id'])
            ->where('teacher_id', $teacher->id)
            ->first();

        if (!$enrollment) {
            return $this->errorResponse('الطالب غير مسجل معك', 404);
        }

        // Generate unique code for this student
        $code = PaymentLog::generateCode($validated['student_id']);

        $payment = PaymentLog::create([
            'client_side_uuid' => $validated['client_side_uuid'],
            'enrollment_id' => $enrollment->id,
            'student_id' => $validated['student_id'],
            'teacher_id' => $teacher->id,
            'amount' => $validated['amount'],
            'confirmation_code' => $code,
            'status' => 'pending',
            'received_by_id' => $teacher->id,
            'received_by_type' => get_class($teacher),
            'expires_at' => now()->addDays(7),
            'notes' => $validated['notes'] ?? null,
        ]);

        return $this->successResponse([
            'payment' => $payment,
            'confirmation_code' => $code,
            'message' => 'تم تسجيل الدفعة - أعط الكود للطالب',
        ], 201);
    }

    /**
     * Batch sync offline payments (max 50 per request)
     */
    public function syncBatch(Request $request)
    {
        $validated = $request->validate([
            'payments' => 'required|array|max:50',
            'payments.*.client_side_uuid' => 'required|uuid',
            'payments.*.student_id' => 'required|uuid',
            'payments.*.amount' => 'required|numeric|min:1',
            'payments.*.confirmation_code' => 'required|string|max:20',
            'payments.*.created_at' => 'required|date',
            'payments.*.notes' => 'nullable|string|max:500',
        ]);

        $teacher = $this->getTeacherFromRequest($request);
        $results = ['success' => [], 'errors' => []];

        foreach ($validated['payments'] as $paymentData) {
            try {
                // Idempotency check
                $existing = PaymentLog::where('client_side_uuid', $paymentData['client_side_uuid'])->first();
                if ($existing) {
                    $results['success'][] = [
                        'client_side_uuid' => $paymentData['client_side_uuid'],
                        'status' => 'duplicate',
                        'payment_id' => $existing->id,
                    ];
                    continue;
                }

                // Find enrollment
                $enrollment = Enrollment::where('student_id', $paymentData['student_id'])
                    ->where('teacher_id', $teacher->id)
                    ->first();

                if (!$enrollment) {
                    throw new \Exception('الطالب غير مسجل معك');
                }

                // Create payment
                $payment = PaymentLog::create([
                    'client_side_uuid' => $paymentData['client_side_uuid'],
                    'enrollment_id' => $enrollment->id,
                    'student_id' => $paymentData['student_id'],
                    'teacher_id' => $teacher->id,
                    'amount' => $paymentData['amount'],
                    'confirmation_code' => $paymentData['confirmation_code'],
                    'status' => 'pending',
                    'received_by_id' => $teacher->id,
                    'received_by_type' => get_class($teacher),
                    'expires_at' => now()->addDays(7),
                    'notes' => $paymentData['notes'] ?? null,
                ]);

                $results['success'][] = [
                    'client_side_uuid' => $paymentData['client_side_uuid'],
                    'status' => 'created',
                    'payment_id' => $payment->id,
                ];

            } catch (\Exception $e) {
                $results['errors'][] = [
                    'client_side_uuid' => $paymentData['client_side_uuid'],
                    'error' => $e->getMessage(),
                ];

                // Log to sync_errors table
                SyncError::create([
                    'client_side_uuid' => $paymentData['client_side_uuid'],
                    'operation_type' => 'payment',
                    'payload' => $paymentData,
                    'error_message' => $e->getMessage(),
                    'user_id' => $teacher->id,
                    'user_type' => get_class($teacher),
                ]);
            }
        }

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

        $payment = PaymentLog::forTeacher($teacher->id)
            ->where('status', 'pending')
            ->findOrFail($id);

        $payment->update(['status' => 'cancelled']);

        return $this->successResponse([
            'message' => 'تم إلغاء الدفعة بنجاح',
        ]);
    }

    /**
     * Get payment statistics
     */
    public function statistics(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);

        $stats = [
            'total' => PaymentLog::forTeacher($teacher->id)->count(),
            'pending' => PaymentLog::forTeacher($teacher->id)->pending()->count(),
            'confirmed' => PaymentLog::forTeacher($teacher->id)->confirmed()->count(),
            'expired' => PaymentLog::forTeacher($teacher->id)->expired()->count(),
            'total_amount' => PaymentLog::forTeacher($teacher->id)->confirmed()->sum('amount'),
            'pending_amount' => PaymentLog::forTeacher($teacher->id)->pending()->sum('amount'),
        ];

        return $this->successResponse($stats);
    }
}
