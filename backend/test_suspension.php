<?php

use App\Models\Teacher;
use Illuminate\Support\Facades\Http;

putenv('CACHE_STORE=array');
putenv('SESSION_DRIVER=array');
putenv('QUEUE_CONNECTION=sync');

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// 1. Create a dummy teacher
$teacher = Teacher::firstOrCreate(
    ['phone' => '01000000000'],
    [
        'name' => 'Test Teacher',
        'password' => bcrypt('password'),
        'is_suspended' => false
    ]
);

echo "Initial Status: " . ($teacher->is_suspended ? 'Suspended' : 'Active') . "\n";

// 2. Simulate the toggle request
$controller = app(\App\Http\Controllers\Admin\TeacherController::class);
$response = $controller->toggleStatus($teacher->id);

$teacher->refresh();
echo "After Toggle 1: " . ($teacher->is_suspended ? 'Suspended' : 'Active') . "\n";

// 3. Toggle back
$controller->toggleStatus($teacher->id);
$teacher->refresh();
echo "After Toggle 2: " . ($teacher->is_suspended ? 'Suspended' : 'Active') . "\n";
