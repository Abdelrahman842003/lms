<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Teacher;
use App\Services\Notifications\BulkNotificationService;
use Illuminate\Support\Facades\Log;

// 1. Get Bulk Service
$bulkService = $app->make(BulkNotificationService::class);

// 2. Define Data
$title = "Admin Simulation Test 2";
$message = "Testing Admin -> Teacher FCM dispatch (Attempt 2)";
$data = [
    'sender_name' => 'Admin Sim',
    'sender_role' => 'admin',
];

// 3. Send to Teachers
echo "Sending to all Teachers...\n";
$query = Teacher::query();
$count = $query->count();
echo "Found {$count} teachers.\n";

try {
    $bulkService->send($query, $title, $message, $data);
    echo "Bulk send initiated. Check logs and queue.\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "Queue Connection: " . config('queue.default') . "\n";
