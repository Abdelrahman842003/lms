<?php

use App\Models\Teacher;
use App\Services\Admin\TeacherService;
use Illuminate\Support\Facades\Log;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    // Get the first active teacher
    $teacher = Teacher::where('status', 'active')->first();

    if (!$teacher) {
        echo "No active teacher found.\n";
        exit(1);
    }

    echo "Testing with teacher: {$teacher->id} ({$teacher->name})\n";

    $paymentService = app(\App\Services\Teacher\PaymentService::class);
    $data = [
        'month' => (int) now()->format('m'),
        'year' => (int) now()->format('Y'),
        'amount' => 100
    ];

    echo "Calling initiateInstapayPayment...\n";

    $result = $paymentService->initiateInstapayPayment($teacher, $data);

    echo "Success! Payment Key: {$result['payment_key']}\n";
    print_r($result);

} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}
