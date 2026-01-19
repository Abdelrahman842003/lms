<?php

declare(strict_types=1);

namespace App\Services\Academy;

use App\DTOs\Academy\PaymentData;
use App\Models\Enrollment;
use App\Models\PaymentLog;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    /**
     * Create a new payment
     */
    public function createPayment($user, PaymentData $data): array
    {
        // Idempotency check
        $existing = PaymentLog::where('client_side_uuid', $data->client_side_uuid)->first();
        if ($existing) {
            return [
                'payment' => $existing,
                'confirmation_code' => $existing->confirmation_code,
                'is_duplicate' => true,
            ];
        }

        // Find enrollment
        $enrollment = Enrollment::where('student_id', $data->student_id)
            ->where('teacher_id', $data->teacher_id)
            ->first();

        if (!$enrollment) {
            throw new \Exception('الطالب غير مسجل مع هذا المدرس');
        }

        // Calculate amounts
        $months = $data->months;
        $discount = $data->discount;
        
        // Get price from group or grade
        $basePrice = 0;
        if ($enrollment->group && $enrollment->group->price > 0) {
            $basePrice = (float) $enrollment->group->price;
        } elseif ($enrollment->grade) {
            $basePrice = (float) $enrollment->grade->price;
        }
        
        // Calculate totals
        $subTotal = $basePrice * $months;
        $discountAmount = $subTotal * ($discount / 100);
        $teacherAmount = $subTotal - $discountAmount;
        
        // Get platform fee (commission)
        $platformFee = (float) Setting::getValue('academy_student_price', 0);
        $commission = $platformFee * $months;
        
        // Total amount = teacher amount + platform commission
        $totalAmount = $teacherAmount + $commission;

        // Generate confirmation code
        $code = PaymentLog::generateCode($data->student_id);

        $payment = DB::transaction(function () use ($data, $enrollment, $totalAmount, $months, $discount, $commission, $code, $user) {
            return PaymentLog::create([
                'client_side_uuid' => $data->client_side_uuid,
                'enrollment_id' => $enrollment->id,
                'student_id' => $data->student_id,
                'teacher_id' => $data->teacher_id,
                'amount' => $totalAmount,
                'months' => $months,
                'discount' => $discount,
                'commission' => $commission,
                'confirmation_code' => $code,
                'status' => 'pending',
                'received_by_id' => $user->id,
                'received_by_type' => get_class($user),
                'expires_at' => now()->addDays(7),
                'notes' => $data->notes,
            ]);
        });

        return [
            'payment' => $payment,
            'confirmation_code' => $code,
            'is_duplicate' => false,
        ];
    }
}
