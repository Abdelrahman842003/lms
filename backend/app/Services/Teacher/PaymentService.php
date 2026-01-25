<?php

declare(strict_types=1);

namespace App\Services\Teacher;

use App\DTOs\Teacher\PaymentData;
use App\Models\Enrollment;
use App\Models\PaymentLog;
use App\Models\Setting;
use App\Models\Teacher;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    /**
     * إنشاء دفعة جديدة (نظام الدفع الكامل للمدرس المستقل)
     */
    public function createPayment(Teacher $teacher, PaymentData $data): array
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
        
        // Get platform fee (commission) for independent teacher
        $platformFee = (float) Setting::getValue('independent_student_price', 0);
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
            \Illuminate\Support\Facades\Log::info("Starting payment notification for payment: " . $payment->id);

            $notificationService = app(\App\Services\NotificationService::class);
            
            // Calculate month names in Arabic
            \Carbon\Carbon::setLocale('ar');
            $monthNames = [];
            $currentDate = $payment->start_date->copy();
            for ($i = 0; $i < $months; $i++) {
                $monthNames[] = $currentDate->translatedFormat('F');
                $currentDate->addMonth();
            }
            $monthsString = implode('، ', $monthNames);
            
            \Illuminate\Support\Facades\Log::info("Months string calculated: " . $monthsString);

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
            \Illuminate\Support\Facades\Log::info("Student notification sent");

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
            \Illuminate\Support\Facades\Log::info("Parent notification sent");

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Payment notification failed: " . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
        }

        return [
            'payment' => $payment,
            'confirmation_code' => $code,
            'is_duplicate' => false,
        ];
    }
    /**
     * Initiate InstaPay payment for teacher subscription
     */
    public function initiateInstapayPayment(Teacher $teacher, array $data): array
    {
        // Find or create subscription record
        $subscription = \App\Models\TeacherSubscription::firstOrCreate(
            [
                'teacher_id' => $teacher->id,
                'month' => \Carbon\Carbon::createFromDate($data['year'], $data['month'], 1)->format('Y-m-d'),
            ],
            [
                'student_count' => 0, // Will be updated by getSubscriptionForMonth logic usually, but here we just need the record
                'amount_due' => 0,
                'amount_paid' => 0,
                'status' => 'pending',
            ]
        );

        // Ensure amount is correct (re-calculate if needed, or trust frontend? Better re-calculate)
        // But for now, let's trust the service that calculates it usually.
        // Actually, we should call getSubscriptionForMonth to ensure it's up to date.
        $subscriptionService = app(\App\Services\Admin\TeacherService::class);
        $subscription = $subscriptionService->getSubscriptionForMonth($teacher->id, $subscription->month->format('Y-m-d'));

        // Generate payment key if not exists
        if (!$subscription->payment_key) {
            $subscription->payment_key = \App\Models\TeacherSubscription::generatePaymentKey();
        }
        
        $subscription->payment_initiated_at = now();
        $subscription->payment_method = 'instapay';
        $subscription->save();

        // Get InstaPay number from settings
        $instapayNumber = Setting::getValue('instapay_number', '');

        // Build payment message
        $months = [
            1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل',
            5 => 'مايو', 6 => 'يونيو', 7 => 'يوليو', 8 => 'أغسطس',
            9 => 'سبتمبر', 10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر'
        ];
        $monthName = $months[$data['month']] ?? '';

        $paymentMessage = "دفع اشتراك منصة نطاق\n";
        $paymentMessage .= "================\n";
        $paymentMessage .= "الكود: {$subscription->payment_key}\n";
        $paymentMessage .= "المدرس: {$teacher->name}\n";
        $paymentMessage .= "الشهر: {$monthName} {$data['year']}\n";
        $paymentMessage .= "المبلغ: {$subscription->amount_due} ج.م\n";
        $paymentMessage .= "عدد الطلاب: {$subscription->student_count}\n";
        $paymentMessage .= "================\n";
        $paymentMessage .= "⚠️ لا تغير هذه الرسالة";

        return [
            'payment_key' => $subscription->payment_key,
            'instapay_number' => $instapayNumber,
            'amount' => $subscription->amount_due,
            'payment_message' => $paymentMessage,
            'teacher_name' => $teacher->name,
            'month' => $data['month'],
            'year' => $data['year'],
            'month_name' => $monthName,
        ];
    }
}
