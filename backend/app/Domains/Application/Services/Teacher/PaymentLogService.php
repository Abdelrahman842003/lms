<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Application\Exceptions\DomainException;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Subscriptions\Models\PaymentLog;
use App\Domains\Application\Models\SyncError;
use App\Domains\Auth\Models\TeacherProfile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PaymentLogService
{
    public function getPayments(TeacherProfile $teacher, int $perPage = 20, array $filters = []): LengthAwarePaginator
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

    public function getPending(TeacherProfile $teacher): Collection
    {
        return PaymentLog::pending()
            ->forTeacher($teacher->id)
            ->with('student:id,name,phone')
            ->latest()
            ->get();
    }

    public function createPayment(TeacherProfile $teacher, array $data): array
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
            ->where('teacher_profile_id', $teacher->id)
            ->with(['academy:id', 'academy.tenantPlan', 'teacher:teachers.id', 'teacher.tenantPlan'])
            ->first();

        if (!$enrollment) {
            throw new DomainException('الطالب غير مسجل معك');
        }

        // Generate unique code for this student
        $code = PaymentLog::generateCode($data['student_id']);

        $payment = PaymentLog::create([
            'client_side_uuid' => $data['client_side_uuid'],
            'enrollment_id' => $enrollment->id,
            'student_id' => $data['student_id'],
            'teacher_profile_id' => $teacher->id,
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

    public function syncBatch(TeacherProfile $teacher, array $payments): array
    {
        $results = ['success' => [], 'errors' => []];

        foreach ($payments as $paymentData) {
            try {
                $results['success'][] = DB::transaction(function () use ($teacher, $paymentData) {
                    // Idempotency check
                    $existing = PaymentLog::where('client_side_uuid', $paymentData['client_side_uuid'])->first();
                    if ($existing) {
                        return [
                            'client_side_uuid' => $paymentData['client_side_uuid'],
                            'status' => 'duplicate',
                            'payment_id' => $existing->id,
                        ];
                    }

                    // Find enrollment
                    $enrollment = Enrollment::where('student_id', $paymentData['student_id'])
                        ->where('teacher_profile_id', $teacher->id)
                        ->with(['academy:id', 'academy.tenantPlan', 'teacher:teachers.id', 'teacher.tenantPlan'])
                        ->first();

                    if (!$enrollment) {
                        throw new DomainException('الطالب غير مسجل معك');
                    }

                    // Create payment
                    $payment = PaymentLog::create([
                        'client_side_uuid' => $paymentData['client_side_uuid'],
                        'enrollment_id' => $enrollment->id,
                        'student_id' => $paymentData['student_id'],
                        'teacher_profile_id' => $teacher->id,
                        'amount' => $paymentData['amount'],
                        'confirmation_code' => $paymentData['confirmation_code'],
                        'status' => 'pending',
                        'received_by_id' => $teacher->id,
                        'received_by_type' => get_class($teacher),
                        'expires_at' => now()->addDays(7),
                        'notes' => $paymentData['notes'] ?? null,
                    ]);

                    return [
                        'client_side_uuid' => $paymentData['client_side_uuid'],
                        'status' => 'created',
                        'payment_id' => $payment->id,
                    ];
                });

            } catch (\Exception $e) {
                $results['errors'][] = [
                    'client_side_uuid' => $paymentData['client_side_uuid'],
                    'error' => $e->getMessage(),
                ];

                // Log to sync_errors table (outside the failed transaction)
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

    public function cancel(TeacherProfile $teacher, string $id): void
    {
        $payment = PaymentLog::forTeacher($teacher->id)
            ->where('status', 'pending')
            ->findOrFail($id);

        $payment->update(['status' => 'cancelled']);
    }

    public function getStatistics(TeacherProfile $teacher): array
    {
        $stats = PaymentLog::forTeacher($teacher->id)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
                SUM(CASE WHEN status = 'expired' OR (status = 'pending' AND expires_at < NOW()) THEN 1 ELSE 0 END) as expired,
                COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END), 0) as total_amount,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount
            ")
            ->first();

        return [
            'total' => (int) $stats->total,
            'pending' => (int) $stats->pending,
            'confirmed' => (int) $stats->confirmed,
            'expired' => (int) $stats->expired,
            'total_amount' => (int) $stats->total_amount,
            'pending_amount' => (int) $stats->pending_amount,
        ];
    }
}
