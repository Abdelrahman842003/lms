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
        $costPerStudent = (float) Setting::getValue('academy_cost_per_student', 0);

        // Calculate total students
        $totalStudents = 0;
        foreach ($academy->activeTeachers as $teacher) {
            $totalStudents += $teacher->activeEnrollments()->count();
        }

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
}
