<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Domains\Auth\Models\Teacher;
use App\Domains\Subscriptions\Services\SubscriptionRenewalService;

$teacher = Teacher::where('name', 'like', '%خالد%')->first();

if (!$teacher) {
    echo "Teacher not found\n";
    exit;
}

echo "Teacher Name: " . $teacher->name . "\n";
echo "Phone: " . $teacher->phone . "\n";
echo "Plan Type (Direct): " . ($teacher->getRawOriginal('plan_type') ?? 'NULL') . "\n";
echo "Plan Expires At (Direct): " . ($teacher->getRawOriginal('plan_expires_at') ?? 'NULL') . "\n";

$service = app(SubscriptionRenewalService::class);
$service->clearSubscriptionCache($teacher); // Force clear
$snapshot = $service->getSubscriptionSnapshot($teacher);

echo "\nSnapshot Data (No Cache):\n";
print_r($snapshot);
