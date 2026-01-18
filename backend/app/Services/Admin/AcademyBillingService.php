<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\Academy;
use App\Models\AcademyBilling;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;

class AcademyBillingService
{
    /**
     * Get paginated billings
     */
    public function getBillings(int $perPage, array $filters): LengthAwarePaginator
    {
        return AcademyBilling::with('academy')
            ->filter($filters)
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->paginate($perPage);
    }

    /**
     * Generate billing for academy
     */
    public function generate(string $academyId, int $month, int $year): AcademyBilling
    {
        $academy = Academy::findOrFail($academyId);

        // Check if billing already exists
        $existing = AcademyBilling::where('academy_id', $academy->id)
            ->where('month', $month)
            ->where('year', $year)
            ->first();

        if ($existing) {
            throw new \Exception('الفاتورة موجودة بالفعل لهذا الشهر');
        }

        // Get cost per student from settings
        $costPerStudent = \App\Services\HelperService::getAcademyStudentPrice();

        // Calculate total enrollments (All Enrollments)
        // We use the same logic as in ReportService: All enrollments of all teachers
        $teacherIds = $academy->teachers()->pluck('teachers.id')->toArray();
        
        $totalStudents = \Illuminate\Support\Facades\DB::table('enrollments')
            ->whereIn('teacher_id', $teacherIds)
            ->count();

        $totalCost = $totalStudents * $costPerStudent;

        return AcademyBilling::create([
            'academy_id' => $academy->id,
            'month' => $month,
            'year' => $year,
            'total_students' => $totalStudents,
            'cost_per_student' => $costPerStudent,
            'total_cost' => $totalCost,
            'status' => 'pending',
        ]);
    }

    /**
     * Update billing status
     */
    public function updateStatus(AcademyBilling $billing, string $status, ?string $notes = null): AcademyBilling
    {
        $billing->status = $status;
        $billing->notes = $notes ?? $billing->notes;

        if ($status === 'paid' && !$billing->paid_at) {
            $billing->paid_at = Carbon::now();
        }

        $billing->save();

        return $billing->fresh();
    }

    /**
     * Get billing statistics
     */
    public function getStatistics(int $year): array
    {
        $totalPending = AcademyBilling::where('year', $year)
            ->pending()
            ->sum('total_cost');

        $totalPaid = AcademyBilling::where('year', $year)
            ->paid()
            ->sum('total_cost');

        $monthlyData = AcademyBilling::where('year', $year)
            ->selectRaw('month, SUM(total_cost) as total, COUNT(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return [
            'year' => $year,
            'total_pending' => $totalPending,
            'total_paid' => $totalPaid,
            'monthly_data' => $monthlyData,
        ];
    }

    /**
     * Delete billing
     */
    public function delete(AcademyBilling $billing): void
    {
        $billing->delete();
    }

    /**
     * Get subscription details for a specific month
     */
    public function getSubscriptionDetails(string $academyId, int $month, int $year): array
    {
        $academy = Academy::findOrFail($academyId);
        
        // Check if billing exists
        $billing = AcademyBilling::where('academy_id', $academy->id)
            ->where('month', $month)
            ->where('year', $year)
            ->first();

        if ($billing) {
            // If pending, refresh calculation to ensure it matches current data
            if ($billing->status === 'pending') {
                $costPerStudent = \App\Services\HelperService::getAcademyStudentPrice();
                $teacherIds = $academy->teachers()->pluck('teachers.id')->toArray();
                
                $currentTotalStudents = \Illuminate\Support\Facades\DB::table('enrollments')
                    ->whereIn('teacher_id', $teacherIds)
                    ->count();
                
                $currentTotalCost = $currentTotalStudents * $costPerStudent;

                if ($billing->total_students !== $currentTotalStudents || $billing->total_cost != $currentTotalCost) {
                    $billing->total_students = $currentTotalStudents;
                    $billing->total_cost = $currentTotalCost;
                    $billing->cost_per_student = $costPerStudent;
                    $billing->save();
                }
            }

            return [
                'student_count' => $billing->total_students,
                'amount_due' => $billing->total_cost,
                'amount_paid' => $billing->amount_paid,
                'status' => $billing->status,
                'remaining' => max(0, $billing->total_cost - $billing->amount_paid),
            ];
        }

        // If not exists, calculate potential
        $costPerStudent = \App\Services\HelperService::getAcademyStudentPrice();
        $totalStudents = 0;
        
        // We need to calculate students active in that month
        // This is an approximation using current active teachers
        $teacherIds = $academy->teachers()->pluck('teachers.id')->toArray();
        
        $totalStudents = \Illuminate\Support\Facades\DB::table('enrollments')
            ->whereIn('teacher_id', $teacherIds)
            ->count();

        $totalCost = $totalStudents * $costPerStudent;

        return [
            'student_count' => $totalStudents,
            'amount_due' => $totalCost,
            'amount_paid' => 0,
            'status' => 'pending',
            'remaining' => $totalCost,
        ];
    }

    /**
     * Pay subscription
     */
    public function paySubscription(string $academyId, int $month, int $year, float $amount): array
    {
        $academy = Academy::findOrFail($academyId);

        // Find or create billing
        $billing = AcademyBilling::where('academy_id', $academy->id)
            ->where('month', $month)
            ->where('year', $year)
            ->first();

        if (!$billing) {
            $billing = $this->generate($academyId, $month, $year);
        }

        // Update status if fully paid
        if ($amount > 0) {
            $billing->amount_paid += $amount;
            
            // If amount covers the cost, mark as paid
            if ($billing->amount_paid >= $billing->total_cost) {
                $billing->status = 'paid';
                $billing->paid_at = Carbon::now();
            } else {
                $billing->status = 'partial';
            }
            
            $billing->save();
        }

        return [
            'student_count' => $billing->total_students,
            'amount_due' => $billing->total_cost,
            'amount_paid' => $billing->amount_paid,
            'status' => $billing->status,
            'remaining' => max(0, $billing->total_cost - $billing->amount_paid),
        ];
    }
}
