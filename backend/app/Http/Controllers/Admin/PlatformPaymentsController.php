<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademyBilling;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PlatformPaymentsController extends Controller
{
    /**
     * List all pending InstaPay payments
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 15);
        $search = $request->get('search');
        $month = $request->get('month');
        $year = $request->get('year');
        $status = $request->get('status', 'pending'); // pending or paid

        // Academy Billings Query
        $academyQuery = AcademyBilling::with('academy')
            ->select([
                'id',
                'academy_id', // Required for relationship
                'academy_id as entity_id',
                'month',
                'year',
                'total_cost as amount',
                'amount_paid',
                'payment_key',
                'payment_initiated_at',
                'status',
                'paid_at',
                'updated_at', // Fallback for paid_at
                \Illuminate\Support\Facades\DB::raw("'academy' as type")
            ]);

        if ($status === 'paid') {
            $academyQuery->where('status', 'paid')
                ->where(function($q) {
                    $q->where('payment_method', 'instapay')
                      ->orWhereNotNull('payment_key');
                });
        } else {
            $academyQuery->awaitingInstapayConfirmation();
        }

        if ($search) {
            $academyQuery->where(function ($q) use ($search) {
                $q->where('payment_key', 'like', "%{$search}%")
                  ->orWhereHas('academy', function ($aq) use ($search) {
                      $aq->where('name', 'like', "%{$search}%");
                  });
            });
        }
        if ($month) $academyQuery->where('month', $month);
        if ($year) $academyQuery->where('year', $year);

        // Teacher Subscriptions Query
        $teacherQuery = \App\Models\TeacherSubscription::with('teacher')
            ->select([
                'id',
                'teacher_id', // Required for relationship
                'teacher_id as entity_id',
                \Illuminate\Support\Facades\DB::raw('MONTH(month) as month_num'),
                \Illuminate\Support\Facades\DB::raw('YEAR(month) as year'),
                'amount_due as amount',
                'amount_paid',
                'payment_key',
                'payment_initiated_at',
                'status',
                'updated_at as paid_at', // TeacherSubscription might not have paid_at, using updated_at as fallback for paid ones
                \Illuminate\Support\Facades\DB::raw("'teacher' as type")
            ]);

        if ($status === 'paid') {
            $teacherQuery->where('status', 'paid')
                ->where(function($q) {
                    $q->where('payment_method', 'instapay')
                      ->orWhereNotNull('payment_key');
                });
        } else {
            $teacherQuery->awaitingInstapayConfirmation();
        }

        if ($search) {
            $teacherQuery->where(function ($q) use ($search) {
                $q->where('payment_key', 'like', "%{$search}%")
                  ->orWhereHas('teacher', function ($tq) use ($search) {
                      $tq->where('name', 'like', "%{$search}%");
                  });
            });
        }
        if ($month) $teacherQuery->whereMonth('month', $month);
        if ($year) $teacherQuery->whereYear('month', $year);

        // Combine and Paginate
        $academyPayments = $academyQuery->get();
        $teacherPayments = $teacherQuery->get();
        
        $allPayments = $academyPayments->concat($teacherPayments);
        
        // Sort by appropriate date
        if ($status === 'paid') {
            $allPayments = $allPayments->sortByDesc('paid_at');
        } else {
            $allPayments = $allPayments->sortByDesc('payment_initiated_at');
        }
        
        // Manual Pagination
        $page = $request->get('page', 1);
        $offset = ($page - 1) * $perPage;
        $paginatedItems = $allPayments->slice($offset, $perPage)->values();
        
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
            $paginatedItems,
            $allPayments->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        // Transform
        $paginator->getCollection()->transform(function ($item) {
            $entityName = $item->type === 'academy' 
                ? ($item->academy->name ?? 'Unknown Academy') 
                : ($item->teacher->name ?? 'Unknown Teacher');

            $month = $item->month_num ?? $item->month;
            
            // Determine paid_at date
            $paidAt = $item->paid_at ?? $item->updated_at;

            return [
                'id' => $item->id,
                'entity_id' => $item->entity_id,
                'entity_name' => $entityName,
                'type' => $item->type, // 'academy' or 'teacher'
                'month' => $month,
                'year' => $item->year,
                'month_name' => $this->getMonthName((int)$month),
                'total_cost' => $item->amount, // Unified field name for frontend
                'amount_paid' => $item->amount_paid,
                'remaining' => $item->amount - $item->amount_paid,
                'payment_key' => $item->payment_key,
                'payment_initiated_at' => $item->payment_initiated_at?->format('Y-m-d H:i'),
                'paid_at' => $paidAt ? (\Carbon\Carbon::parse($paidAt)->format('Y-m-d H:i')) : null,
                'status' => $item->status,
            ];
        });

        return $this->successResponse($paginator, 'تم استرجاع المدفوعات بنجاح');
    }

    private function getMonthName(int $month): string
    {
        $months = [
            1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل',
            5 => 'مايو', 6 => 'يونيو', 7 => 'يوليو', 8 => 'أغسطس',
            9 => 'سبتمبر', 10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر'
        ];
        return $months[$month] ?? '';
    }

    /**
     * Confirm an InstaPay payment
     */
    public function confirm(Request $request, string $id): JsonResponse
    {
        $type = $request->input('type', 'academy'); // Default to academy for backward compatibility
        
        if ($type === 'teacher') {
            $billing = \App\Models\TeacherSubscription::find($id);
            $amountField = 'amount_due';
        } else {
            $billing = AcademyBilling::find($id);
            $amountField = 'total_cost';
        }

        if (!$billing) {
            return $this->errorResponse('الفاتورة غير موجودة', 404);
        }

        if ($billing->status === 'paid') {
            return $this->errorResponse('تم تأكيد الدفع مسبقاً', 422);
        }

        // Update billing
        $billing->status = 'paid';
        // TeacherSubscription doesn't have paid_at in fillable usually, but let's check model
        // AcademyBilling has paid_at. TeacherSubscription might not.
        // Let's check TeacherSubscription migration/model.
        // TeacherSubscription has amount_paid.
        
        if ($type === 'academy') {
            $billing->paid_at = now();
        }
        
        $billing->amount_paid = $billing->$amountField;
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
        // Academy Stats
        $academyConfirmedCount = AcademyBilling::where('payment_method', 'instapay')
            ->where('status', 'paid')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->count();

        $academyConfirmedAmount = AcademyBilling::where('payment_method', 'instapay')
            ->where('status', 'paid')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount_paid');

        // Teacher Stats
        $teacherConfirmedCount = \App\Models\TeacherSubscription::where('payment_method', 'instapay')
            ->where('status', 'paid')
            ->whereMonth('updated_at', now()->month) // Using updated_at as proxy for paid_at
            ->whereYear('updated_at', now()->year)
            ->count();

        $teacherConfirmedAmount = \App\Models\TeacherSubscription::where('payment_method', 'instapay')
            ->where('status', 'paid')
            ->whereMonth('updated_at', now()->month)
            ->whereYear('updated_at', now()->year)
            ->sum('amount_paid');

        return $this->successResponse([
            'confirmed_this_month' => $academyConfirmedCount + $teacherConfirmedCount,
            'confirmed_amount_this_month' => $academyConfirmedAmount + $teacherConfirmedAmount,
        ], 'تم استرجاع الإحصائيات بنجاح');
    }
}
