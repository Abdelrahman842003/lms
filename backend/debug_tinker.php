$service = new \App\Services\Admin\ReportService();
$academy = \App\Models\Academy::where('name', 'LIKE', '%النجاح%')->first();

if (!$academy) {
    echo "Academy not found. Using first academy.\n";
    $academy = \App\Models\Academy::first();
}

echo "Academy: " . $academy->name . " (ID: " . $academy->id . ")\n";

// Date range: May 2026
$startDate = \Carbon\Carbon::create(2026, 5, 1)->startOfDay();
$endDate = \Carbon\Carbon::create(2026, 5, 31)->endOfDay();

echo "Period: " . $startDate->toDateTimeString() . " to " . $endDate->toDateTimeString() . "\n";

$report = $service->getAcademyReport($academy, $startDate, $endDate);

print_r($report['summary']);
