<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Domains\Auth\Models\Teacher;
use App\Domains\Subscriptions\Services\SubscriptionRenewalService;
use Illuminate\Support\Facades\Cache;

$teacher = Teacher::where('name', 'like', '%خالد%')->first();
$service = app(SubscriptionRenewalService::class);

// 1. Warm the cache
$service->getSubscriptionSnapshot($teacher);
$cacheKey = "subscription_snapshot_{$teacher->id}_Teacher";
echo "Cache exists: " . (Cache::has($cacheKey) ? 'Yes' : 'No') . "\n";

// 2. Save the model
echo "Saving teacher...\n";
$teacher->save();

// 3. Check cache
echo "Cache exists after save: " . (Cache::has($cacheKey) ? 'Yes' : 'No') . "\n";
