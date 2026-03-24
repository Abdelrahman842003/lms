<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Subscriptions\DTOs\TeacherPaymentData;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Subscriptions\Models\PaymentLog;
use App\Domains\Application\Models\Setting;
use App\Domains\Auth\Models\Teacher;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    /**
     * إنشاء دفعة جديدة (نظام الدفع الكامل للمدرس المستقل)
     */
    public function createPayment(Teacher $teacher, TeacherPaymentData $data): array
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
            ->where('teacher_id', $teacher->id)
            ->first();

        if (!$enrollment) {
            throw new \Exception('الطالب غير مسجل معك');
        }

        // Calculate amounts
        $months = $data->months;
        $discount = $data->discount;
        
        // Get price based on group type (private groups have their own price)
        $basePrice = 0;
        $priceSource = 'grade';
        
        if ($enrollment->group && $enrollment->group->type === 'private' && $enrollment->group->price > 0) {
            $basePrice = (float) $enrollment->group->price;
            $priceSource = 'group';
        } elseif ($enrollment->grade && $enrollment->grade->price > 0) {
            $basePrice = (float) $enrollment->grade->price;
            $priceSource = 'grade';
        }
        
        // Calculate totals
        $subTotal = $basePrice * $months;
        $discountAmount = $subTotal * ($discount / 100);
        $teacherAmount = $subTotal - $discountAmount;
        
        // Platform fee removed - teacher pays via subscription system
        $commission = 0;
        
        // Total amount = teacher amount only (no platform commission)
        $totalAmount = $teacherAmount;

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
        $autoNotes[] = "الإجمالي المطلوب: {$totalAmount} ج.م";

        // Combine user notes with auto-generated notes
        $finalNotes = implode(' | ', $autoNotes);
        if ($data->notes) {
            $finalNotes = $data->notes . ' | ' . $finalNotes;
        }

        // Generate confirmation code
        $code = PaymentLog::generateCode($data->student_id);

        $payment = DB::transaction(function () use ($data, $enrollment, $totalAmount, $months, $discount, $commission, $code, $teacher, $basePrice, $teacherAmount, $priceSource, $finalNotes) {
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
                'teacher_id' => $teacher->id,
                'amount' => $totalAmount,
                'months' => $months,
                'discount' => $discount,
                'commission' => $commission,
                'base_price' => $basePrice,
                'teacher_amount' => $teacherAmount,
                'price_source' => $priceSource,
                'confirmation_code' => $code,
                'status' => 'pending',
                'received_by_id' => $teacher->id,
                'received_by_type' => get_class($teacher),
                'expires_at' => now()->addDays(7),
                'notes' => $finalNotes,
                'start_date' => $startDate,
                'end_date' => $newEnd,
            ]);
        });

        // Send Notifications
        try {
            $notificationService = app(\App\Domains\Notifications\Services\NotificationService::class);

            // Calculate month names in Arabic
            \Carbon\Carbon::setLocale('ar');
            $monthNames = [];
            $currentDate = $payment->start_date->copy();
            for ($i = 0; $i < $months; $i++) {
                $monthNames[] = $currentDate->translatedFormat('F');
                $currentDate->addMonth();
            }
            $monthsString = implode('، ', $monthNames);

            $title = "تم دفع اشتراك جديد";
            $message = "تم دفع شهر {$monthsString} بنجاح";
            
            // Add user notes if exist (splitting from auto-generated notes)
            if ($data->notes) {
                $message .= "\nملاحظات: " . $data->notes;
            }

            // Determine Sender Name
            $senderName = $teacher->name;
            if ($enrollment->academy_id) {
                $enrollment->load('academy');
                if ($enrollment->academy) {
                    $senderName = $teacher->name . ' - ' . $enrollment->academy->name;
                }
            }

            // Notify Student
            $notificationService->send(
                $enrollment->student,
                'student',
                $title,
                $message,
                [
                    'payment_id' => $payment->id,
                    'sender_name' => $senderName
                ],
                'payment'
            );

            // Notify Parent
            $notificationService->sendToParent(
                $enrollment->student,
                $title,
                $message,
                [
                    'payment_id' => $payment->id,
                    'sender_name' => $senderName
                ],
                'payment',
                true // Skip DB storage to avoid duplicates in parent view
            );

        } catch (\Exception $e) {
            // Silent fail - payment was already created successfully
        }

        return [
            'payment' => $payment,
            'confirmation_code' => $code,
            'is_duplicate' => false,
        ];
    }
}
