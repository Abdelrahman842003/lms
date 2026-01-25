<?php

use App\Services\Admin\ReportService;
use App\Models\Academy;
use Carbon\Carbon;

if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
    $app = require_once __DIR__ . '/bootstrap/app.php';
} else {
    require __DIR__ . '/backend/vendor/autoload.php';
    $app = require_once __DIR__ . '/backend/bootstrap/app.php';
}
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Find the academy from the screenshot (Name: أكاديمية النجاح التعليمية)
$academy = Academy::where('name', 'LIKE', '%النجاح%')->first();

if (!$academy) {
    echo "Academy not found. Using first academy.\n";
    $academy = Academy::first();
}

echo "Academy: " . $academy->name . " (ID: " . $academy->id . ")\n";

$service = new ReportService();

// Date range: May (as per screenshot)
// Assuming current year 2026 based on metadata, but screenshot says "May".
// Let's try May 2026.
$startDate = Carbon::create(2026, 5, 1)->startOfDay();
$endDate = Carbon::create(2026, 5, 31)->endOfDay();

echo "Period: " . $startDate->toDateTimeString() . " to " . $endDate->toDateTimeString() . "\n";

$report = $service->getAcademyReport($academy, $startDate, $endDate);

echo "\n--- Summary ---\n";
print_r($report['summary']);

echo "\n--- Analysis ---\n";
echo "Total Revenue (Students): " . $report['summary']['total_revenue'] . "\n";
echo "Platform Fees: " . $report['summary']['platform_fees'] . "\n";
echo "Expected Revenue: " . $report['summary']['expected_revenue'] . "\n";
echo "Confirmed Payments: " . $report['summary']['confirmed_payments'] . "\n";
echo "Remaining Balance: " . $report['summary']['remaining_balance'] . "\n";

if ($report['summary']['remaining_balance'] == 18000) {
    echo "\nISSUE REPRODUCED: Remaining Balance is 18,000.\n";
} else {
    echo "\nIssue NOT reproduced with these dates.\n";
}

echo "\n=============================================\n";
echo "Testing Academy View Report Logic (New Logic)\n";
echo "=============================================\n";

$attendanceService = new \App\Services\Academy\AttendanceService();
$academyReportService = new \App\Services\Academy\ReportService($attendanceService);

// Use same period: May 2026
$monthlyReport = $academyReportService->generateMonthlyReport($academy, 5, 2026);

echo "\n--- Financial Details ---\n";
print_r($monthlyReport['financial_details']);

echo "\n--- Verification ---\n";
echo "Remaining Balance (Academy View): " . $monthlyReport['financial_details']['remaining_balance'] . "\n";
echo "Linked Students (Academy View): " . $monthlyReport['summary']['linked_students_count'] . "\n";
echo "Should be > 0 if there are active enrollments regardless of creation date.\n";

