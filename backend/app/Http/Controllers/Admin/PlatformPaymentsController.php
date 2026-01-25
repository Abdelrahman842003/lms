<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademyBilling;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PlatformPaymentsController extends Controller
{
    /**
     * List all pending InstaPay payments
     */
    public function index(Request $request): JsonResponse
    {
        $query = AcademyBilling::with('academy')
            ->awaitingInstapayConfirmation()
            ->orderBy('payment_initiated_at', 'desc');

        // Filter by search (payment key or academy name)
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('payment_key', 'like', "%{$search}%")
                  ->orWhereHas('academy', function ($aq) use ($search) {
                      $aq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by month
        if ($month = $request->get('month')) {
            $query->where('month', $month);
        }

        // Filter by year
        if ($year = $request->get('year')) {
            $query->where('year', $year);
        }

        $payments = $query->paginate($request->get('per_page', 15));

        // Transform the data
        $payments->getCollection()->transform(function ($billing) {
            return [
                'id' => $billing->id,
                'academy_id' => $billing->academy_id,
                'academy_name' => $billing->academy?->name ?? 'غير معروف',
                'month' => $billing->month,
                'year' => $billing->year,
                'month_name' => $billing->month_name,
                'total_cost' => $billing->total_cost,
                'amount_paid' => $billing->amount_paid,
                'remaining' => $billing->remaining_balance,
                'total_students' => $billing->total_students,
                'payment_key' => $billing->payment_key,
                'payment_initiated_at' => $billing->payment_initiated_at?->format('Y-m-d H:i'),
                'status' => $billing->status,
            ];
        });

        return $this->successResponse($payments, 'تم استرجاع المدفوعات بنجاح');
    }

    /**
     * Confirm an InstaPay payment
     */
    public function confirm(Request $request, string $id): JsonResponse
    {
        $billing = AcademyBilling::find($id);

        if (!$billing) {
            return $this->errorResponse('الفاتورة غير موجودة', 404);
        }

        if ($billing->status === 'paid') {
            return $this->errorResponse('تم تأكيد الدفع مسبقاً', 422);
        }

        // Update billing
        $billing->status = 'paid';
        $billing->paid_at = now();
        $billing->amount_paid = $billing->total_cost;
        $billing->notes = ($billing->notes ?? '') . "\nتم التأكيد بواسطة الأدمن عبر InstaPay: " . now()->format('Y-m-d H:i');
        $billing->save();

        return $this->successResponse([
            'id' => $billing->id,
            'payment_key' => $billing->payment_key,
            'status' => 'paid',
        ], 'تم تأكيد الدفع بنجاح');
    }

    /**
     * Get payment statistics
     */
    public function stats(): JsonResponse
    {
        $pending = AcademyBilling::awaitingInstapayConfirmation()->count();
        $pendingAmount = AcademyBilling::awaitingInstapayConfirmation()->sum('total_cost');
        
        $confirmedThisMonth = AcademyBilling::where('payment_method', 'instapay')
            ->where('status', 'paid')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->count();

        $confirmedAmountThisMonth = AcademyBilling::where('payment_method', 'instapay')
            ->where('status', 'paid')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount_paid');

        return $this->successResponse([
            'pending_count' => $pending,
            'pending_amount' => $pendingAmount,
            'confirmed_this_month' => $confirmedThisMonth,
            'confirmed_amount_this_month' => $confirmedAmountThisMonth,
        ], 'تم استرجاع الإحصائيات بنجاح');
    }
}
