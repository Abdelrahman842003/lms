<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = app(App\Services\Admin\TeacherService::class);

echo "Testing Filter: status = suspended\n";
$teachers = $service->getTeachers(10, ['status' => 'suspended']);
foreach ($teachers as $teacher) {
    echo "Teacher: {$teacher->name}, Status: {$teacher->status}\n";
}

echo "\nTesting Filter: status = active\n";
$teachers = $service->getTeachers(10, ['status' => 'active']);
foreach ($teachers as $teacher) {
    echo "Teacher: {$teacher->name}, Status: {$teacher->status}\n";
}

echo "\nTesting Filter: status = pending\n";
$teachers = $service->getTeachers(10, ['status' => 'pending']);
foreach ($teachers as $teacher) {
    echo "Teacher: {$teacher->name}, Status: {$teacher->status}\n";
}

echo "\nTesting Filter: status = all\n";
$teachers = $service->getTeachers(10, ['status' => 'all']);
echo "Count: " . count($teachers) . "\n";
