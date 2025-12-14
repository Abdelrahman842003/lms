<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Student;
use App\Models\DeviceToken;
use App\Notifications\AdminNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

// 1. Find or Create a Student
$student = Student::first();
if (!$student) {
    echo "No students found. Please create a student first.\n";
    exit(1);
}

echo "Selected Student: {$student->name} (ID: {$student->id})\n";
echo "Queue Connection: " . config('queue.default') . "\n";


// 2. Add a Fake Token (if not exists)
$fakeToken = "fake_token_for_simulation_" . time();
$student->deviceTokens()->create([
    'token' => $fakeToken,
    'device_type' => 'web',
    'last_used_at' => now(),
]);

echo "Added Fake Token: {$fakeToken}\n";

// 3. Send Notification
echo "Sending Notification...\n";

try {
    Notification::send($student, new AdminNotification(
        "Test Notification",
        "This is a simulation message to verify FCM dispatch.",
        "System Admin",
        "admin"
    ));
    echo "Notification dispatched via Laravel Notification Facade.\n";
} catch (\Exception $e) {
    echo "Error sending notification: " . $e->getMessage() . "\n";
}

// 4. Check Logs (User needs to check logs manually or we can tail them)
echo "Check storage/logs/laravel.log for FCM attempt details.\n";
