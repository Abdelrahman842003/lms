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
echo "Plan Type: " . ($teacher->plan_type ?? 'NULL') . "\n";
echo "Subscription Period: " . ($teacher->subscription_period ?? 'NULL') . "\n";
echo "Plan Expires At: " . ($teacher->plan_expires_at ?? 'NULL') . "\n";
echo "Subscription Fee: " . ($teacher->subscription_fee ?? '0') . "\n";
echo "Paid Amount: " . ($teacher->paid_amount ?? '0') . "\n";

$service = app(SubscriptionRenewalService::class);
$snapshot = $service->getSubscriptionSnapshot($teacher);

echo "\nSnapshot Data:\n";
print_r($snapshot);
