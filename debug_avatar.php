<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$student = App\Models\Student::where('name', 'LIKE', '%ساره عيد%')->first();
if ($student) {
    echo "Found Student: " . $student->name . "\n";
    echo "Avatar Key: " . ($student->avatar_key ?? 'NULL') . "\n";
    
    // Check if ImageService works
    if ($student->avatar_key) {
        try {
            $url = app(\App\Services\Media\ImageService::class)->getUrl($student->avatar_key);
            echo "Generated URL: " . $url . "\n";
        } catch (\Exception $e) {
            echo "ImageService Error: " . $e->getMessage() . "\n";
        }
    }
} else {
    echo "Student not found\n";
}
