<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\PaymentLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class PaymentConfirmationController extends Controller
{
    /**
     * Confirm payment with code (Rate Limited: 5 attempts per hour)
     */
    public function confirm(Request $request)
    {
        $student = $request->user();
        $rateLimitKey = 'payment-confirm:' . $student->id;

        // Rate Limiting: 5 attempts per hour
        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            $minutes = ceil($seconds / 60);
            
            return $this->errorResponse(
                "تم تجاوز عدد المحاولات. حاول بعد {$minutes} دقيقة",
                429
            );
        }

        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'regex:/^[A-Z0-9]{4}-[A-Z0-9]{4}$/',
            ],
        ], [
            'code.regex' => 'صيغة الكود غير صحيحة. الصيغة الصحيحة: XXXX-XXXX',
        ]);

        // Find pending payment for this student with this code
        $payment = PaymentLog::where('confirmation_code', strtoupper($validated['code']))
            ->where('student_id', $student->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if (!$payment) {
            // Increment rate limit on failure
            RateLimiter::hit($rateLimitKey, 3600); // 1 hour TTL
            
            return $this->errorResponse(
                'كود غير صحيح أو منتهي الصلاحية',
                404
            );
        }

        // Clear rate limit on success
        RateLimiter::clear($rateLimitKey);

        // Update payment status
        $payment->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
            'ip_address' => $request->ip(),
            'device_info' => $request->userAgent(),
        ]);

        // Activate subscription
        $enrollment = $payment->enrollment;
        $subscriptionEnd = now()->addDays(30);
        
        $enrollment->update([
            'is_active' => true,
            'subscription_start' => now(),
            'subscription_end' => $subscriptionEnd,
        ]);

        return $this->successResponse([
            'message' => 'تم تأكيد الدفع وتفعيل الاشتراك بنجاح',
            'amount' => $payment->amount,
            'teacher_name' => $payment->teacher->name ?? null,
            'subscription_end' => $subscriptionEnd->format('Y-m-d'),
            'days_left' => 30,
        ]);
    }

    /**
     * Get pending payments awaiting confirmation
     */
    public function pending(Request $request)
    {
        $student = $request->user();

        $payments = PaymentLog::where('student_id', $student->id)
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->with('teacher:id,name')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'teacher_name' => $payment->teacher->name ?? 'غير معروف',
                    'created_at' => $payment->created_at->format('Y-m-d H:i'),
                    'expires_at' => $payment->expires_at->format('Y-m-d H:i'),
                    'days_until_expiration' => $payment->days_until_expiration,
                ];
            });

        return $this->successResponse([
            'payments' => $payments,
            'count' => $payments->count(),
        ]);
    }

    /**
     * Get payment history
     */
    public function history(Request $request)
    {
        $student = $request->user();
        $perPage = $request->input('per_page', 20);

        $payments = PaymentLog::where('student_id', $student->id)
            ->with('teacher:id,name')
            ->latest()
            ->paginate($perPage);

        return $this->successResponse([
            'payments' => $payments,
        ]);
    }
}
