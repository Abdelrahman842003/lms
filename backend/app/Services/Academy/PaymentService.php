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

        // Find enrollment with relationships
        $enrollment = Enrollment::with(['grade', 'group'])
            ->where('student_id', $data->student_id)
            ->where('teacher_id', $data->teacher_id)
            ->first();

        if (!$enrollment) {
            throw new \Exception('الطالب غير مسجل مع هذا المدرس');
        }

        // Calculate amounts
        $months = $data->months;
        $discount = $data->discount;
        
        // Get price based on group type (private groups have their own price)
        $basePrice = 0;
        $priceSource = 'grade';
        
        if ($enrollment->group && $enrollment->group->type === 'private' && $enrollment->group->price > 0) {
            // Private group: use group price
            $basePrice = (float) $enrollment->group->price;
            $priceSource = 'group';
        } elseif ($enrollment->grade && $enrollment->grade->price > 0) {
            // General group: use teacher's grade price
            $basePrice = (float) $enrollment->grade->price;
            $priceSource = 'grade';
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

        // Build auto-generated notes
        $autoNotes = [];
        if ($months > 1) {
            $autoNotes[] = "عدد الأشهر: {$months}";
        }
        if ($discount > 0) {
            $autoNotes[] = "خصم: {$discount}%";
        }
        $autoNotes[] = "السعر الأساسي: {$basePrice} × {$months} = {$subTotal} ج.م";
        if ($discountAmount > 0) {
            $autoNotes[] = "المبلغ بعد الخصم: {$teacherAmount} ج.م";
        }
        if ($commission > 0) {
            $autoNotes[] = "حساب المنصة: {$commission} ج.م";
        }
        $autoNotes[] = "الإجمالي المطلوب: {$totalAmount} ج.م";

        // Combine user notes with auto-generated notes
        $finalNotes = implode(' | ', $autoNotes);
        if ($data->notes) {
            $finalNotes = $data->notes . ' | ' . $finalNotes;
        }

        // Generate confirmation code
        $code = PaymentLog::generateCode($data->student_id);

        $payment = DB::transaction(function () use ($data, $enrollment, $totalAmount, $months, $discount, $commission, $code, $user, $basePrice, $teacherAmount, $priceSource, $finalNotes) {
            // Update enrollment subscription
            if ($data->start_date) {
                $startDate = \Carbon\Carbon::parse($data->start_date)->startOfMonth();
            } else {
                $startDate = $enrollment->subscription_end && $enrollment->subscription_end > now() 
                    ? $enrollment->subscription_end->copy()->addDay()->startOfMonth()
                    : now()->startOfMonth();
            }
            
            $newEnd = $startDate->copy()->addMonths($months - 1)->endOfMonth();
            
            $enrollment->update([
                'subscription_end' => $newEnd,
                'subscription_start' => $enrollment->subscription_start ?? now(),
                'is_active' => true,
            ]);

            return PaymentLog::create([
                'client_side_uuid' => $data->client_side_uuid,
                'enrollment_id' => $enrollment->id,
                'student_id' => $data->student_id,
                'teacher_id' => $data->teacher_id,
                'amount' => $totalAmount,
                'months' => $months,
                'discount' => $discount,
                'commission' => $commission,
                'base_price' => $basePrice,
                'teacher_amount' => $teacherAmount,
                'price_source' => $priceSource,
                'confirmation_code' => $code,
                'status' => 'pending',
                'received_by_id' => $user->id,
                'received_by_type' => get_class($user),
                'expires_at' => now()->addDays(7),
                'notes' => $finalNotes,
                'start_date' => $startDate,
                'end_date' => $newEnd,
            ]);
        });

        return [
            'payment' => $payment,
            'confirmation_code' => $code,
            'is_duplicate' => false,
        ];
    }
}
