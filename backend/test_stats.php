<?php

use App\Services\Admin\DashboardService;
use App\Models\Setting;
use App\Models\Enrollment;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = new DashboardService();
$stats = $service->getStats();

echo "Stats:\n";
print_r($stats);

echo "\nPrice Per Student Setting: " . Setting::where('key', 'pricePerStudent')->value('value') . "\n";
echo "Active Enrollments Count: " . Enrollment::where('is_active', true)->count() . "\n";
