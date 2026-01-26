<?php

use App\Models\PaymentLog;
use App\Models\Setting;
use App\Services\HelperService;
use Carbon\Carbon;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- Settings ---\n";
echo "Price Per Student: " . HelperService::getPricePerStudent() . "\n";
echo "Academy Student Price: " . HelperService::getAcademyStudentPrice() . "\n";

echo "\n--- PaymentLog Stats ---\n";
$totalLogs = PaymentLog::count();
echo "Total PaymentLogs: $totalLogs\n";

$confirmedLogs = PaymentLog::where('status', 'confirmed')->count();
echo "Confirmed PaymentLogs: $confirmedLogs\n";

$startDate = Carbon::now()->startOfMonth();
$endDate = Carbon::now()->endOfMonth();

echo "\n--- Current Month (" . $startDate->format('Y-m-d') . " to " . $endDate->format('Y-m-d') . ") ---\n";
$currentMonthLogs = PaymentLog::where('status', 'confirmed')
    ->whereBetween('confirmed_at', [$startDate, $endDate])
    ->get();

echo "Confirmed Logs in Current Month: " . $currentMonthLogs->count() . "\n";
echo "Sum of Months: " . $currentMonthLogs->sum('months') . "\n";
echo "Sum of Amount: " . $currentMonthLogs->sum('amount') . "\n";

if ($currentMonthLogs->count() > 0) {
    echo "\nSample Log:\n";
    print_r($currentMonthLogs->first()->toArray());
}

echo "\n--- ReportService Output ---\n";
$reportService = new \App\Services\Admin\ReportService();
$startDate = Carbon::now()->startOfMonth();
$endDate = Carbon::now()->endOfMonth();

try {
    $report = $reportService->getAdminReport($startDate, $endDate);
    echo "Total Academies: " . json_encode($report['summary']['total_academies']) . "\n";
    echo "Independent Teachers: " . json_encode($report['summary']['independent_teachers_count']) . "\n";
    echo "Total Subscriptions: " . json_encode($report['summary']['total_subscriptions']) . "\n";
    echo "Full Summary Keys: " . implode(', ', array_keys($report['summary'])) . "\n";
} catch (\Exception $e) {
    echo "Error calling ReportService: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}

echo "\n--- Teacher Inspection ---\n";
$teachers = \App\Models\Teacher::with('academies')->get();
foreach ($teachers as $teacher) {
    echo "Teacher: {$teacher->name} (ID: {$teacher->id})\n";
    echo "  Academies Count: " . $teacher->academies->count() . "\n";
    echo "  Is Independent (Logic): " . ($teacher->academies->isEmpty() ? 'Yes' : 'No') . "\n";
    echo "  Attributes: " . json_encode($teacher->getAttributes()) . "\n";
    echo "--------------------------------\n";
}
