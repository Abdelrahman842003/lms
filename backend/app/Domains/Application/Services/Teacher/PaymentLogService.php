<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Subscriptions\Models\PaymentLog;
use App\Domains\Support\Models\SyncError;
use App\Domains\Auth\Models\Teacher;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PaymentLogService
{
    public function getPayments(Teacher $teacher, int $perPage = 20, array $filters = []): LengthAwarePaginator
    {
        $query = PaymentLog::forTeacher($teacher->id)
            ->with('student:id,name,phone');

        // Filter by status
        if (isset($filters['status']) && $filters['status']) {
            if ($filters['status'] === 'expired') {
                $query->expired();
            } else {
                $query->where('status', $filters['status']);
            }
        }

        // Search by student name or phone
        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }

    public function getPending(Teacher $teacher): Collection
    {
        return PaymentLog::pending()
            ->forTeacher($teacher->id)
            ->with('student:id,name,phone')
            ->latest()
            ->get();
    }

    public function createPayment(Teacher $teacher, array $data): array
    {
        // Idempotency check
        $existing = PaymentLog::where('client_side_uuid', $data['client_side_uuid'])->first();
        if ($existing) {
            return [
                'payment' => $existing,
                'confirmation_code' => $existing->confirmation_code,
                'message' => 'الدفعة مسجلة مسبقاً',
                'is_duplicate' => true,
            ];
        }

        // Find enrollment
        $enrollment = Enrollment::where('student_id', $data['student_id'])
            ->where('teacher_id', $teacher->id)
            ->first();

        if (!$enrollment) {
            throw new \Exception('الطالب غير مسجل معك');
        }

        // Generate unique code for this student
        $code = PaymentLog::generateCode($data['student_id']);

        $payment = PaymentLog::create([
            'client_side_uuid' => $data['client_side_uuid'],
            'enrollment_id' => $enrollment->id,
            'student_id' => $data['student_id'],
            'teacher_id' => $teacher->id,
            'amount' => $data['amount'],
            'confirmation_code' => $code,
            'status' => 'pending',
            'received_by_id' => $teacher->id,
            'received_by_type' => get_class($teacher),
            'expires_at' => now()->addDays(7),
            'notes' => $data['notes'] ?? null,
        ]);

        return [
            'payment' => $payment,
            'confirmation_code' => $code,
            'message' => 'تم تسجيل الدفعة - أعط الكود للطالب',
            'is_duplicate' => false,
        ];
    }

    public function syncBatch(Teacher $teacher, array $payments): array
    {
        $results = ['success' => [], 'errors' => []];

        foreach ($payments as $paymentData) {
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

        return $results;
    }

    public function cancel(Teacher $teacher, string $id): void
    {
        $payment = PaymentLog::forTeacher($teacher->id)
            ->where('status', 'pending')
            ->findOrFail($id);

        $payment->update(['status' => 'cancelled']);
    }

    public function getStatistics(Teacher $teacher): array
    {
        return [
            'total' => PaymentLog::forTeacher($teacher->id)->count(),
            'pending' => PaymentLog::forTeacher($teacher->id)->pending()->count(),
            'confirmed' => PaymentLog::forTeacher($teacher->id)->confirmed()->count(),
            'expired' => PaymentLog::forTeacher($teacher->id)->expired()->count(),
            'total_amount' => PaymentLog::forTeacher($teacher->id)->confirmed()->sum('amount'),
            'pending_amount' => PaymentLog::forTeacher($teacher->id)->pending()->sum('amount'),
        ];
    }
}
