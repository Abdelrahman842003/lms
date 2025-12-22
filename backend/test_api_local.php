<?php

use App\Models\Teacher;
use Illuminate\Support\Facades\Auth;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// 1. Login as a teacher
$teacher = Teacher::first();

if (!$teacher) {
    die("No teacher found.\n");
}

echo "Testing with Teacher: {$teacher->name} ({$teacher->id})\n";

// Mock authentication
Auth::guard('teacher')->setUser($teacher);

// 2. Create Request
$request = Illuminate\Http\Request::create('/api/teacher/notifications', 'POST', [
    'title' => 'Test Notification',
    'message' => 'This is a test message',
    'recipient_type' => 'all',
]);

$request->headers->set('Accept', 'application/json');

// 3. Resolve Controller
$controller = $app->make(\App\Http\Controllers\Teacher\NotificationController::class);

// 4. Execute
try {
    $response = $controller->store($app->make(\App\Http\Requests\Teacher\Notification\SendNotificationRequest::class));
    echo "Response Status: " . $response->getStatusCode() . "\n";
    echo "Response Content: " . $response->getContent() . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo $e->getTraceAsString();
}
