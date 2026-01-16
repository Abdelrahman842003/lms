<?php

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\PaymentLog;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Store a new payment for a student (Academy/Secretary recording)
     */
    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|uuid|exists:students,id',
            'teacher_id' => 'required|uuid|exists:teachers,id',
            'months' => 'required|integer|min:1',
            'discount' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string|max:500',
            'client_side_uuid' => 'required|uuid',
        ]);

        // Idempotency check
        $existing = PaymentLog::where('client_side_uuid', $request->client_side_uuid)->first();
        if ($existing) {
            return response()->json([
                'status' => true,
                'status_code' => 200,
                'message' => 'الدفعة مسجلة مسبقاً',
                'data' => [
                    'payment' => $existing,
                    'confirmation_code' => $existing->confirmation_code,
                    'is_duplicate' => true,
                ],
            ]);
        }

        // Find enrollment
        $enrollment = Enrollment::where('student_id', $request->student_id)
            ->where('teacher_id', $request->teacher_id)
            ->first();

        if (!$enrollment) {
            return response()->json([
                'status' => false,
                'status_code' => 422,
                'message' => 'الطالب غير مسجل مع هذا المدرس',
                'data' => null,
            ], 422);
        }

        // Calculate amounts
        $months = (int) $request->months;
        $discount = (float) ($request->discount ?? 0);
        
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
        $code = PaymentLog::generateCode($request->student_id);

        // Get current user (academy or secretary)
        $user = $request->user();

        $payment = DB::transaction(function () use ($request, $enrollment, $totalAmount, $months, $discount, $commission, $code, $user) {
            return PaymentLog::create([
                'client_side_uuid' => $request->client_side_uuid,
                'enrollment_id' => $enrollment->id,
                'student_id' => $request->student_id,
                'teacher_id' => $request->teacher_id,
                'amount' => $totalAmount,
                'months' => $months,
                'discount' => $discount,
                'commission' => $commission,
                'confirmation_code' => $code,
                'status' => 'pending',
                'received_by_id' => $user->id,
                'received_by_type' => get_class($user),
                'expires_at' => now()->addDays(7),
                'notes' => $request->notes,
            ]);
        });

        return response()->json([
            'status' => true,
            'status_code' => 201,
            'message' => 'تم تسجيل الدفعة بنجاح',
            'data' => [
                'payment' => $payment,
                'confirmation_code' => $code,
                'is_duplicate' => false,
            ],
        ], 201);
    }
}
