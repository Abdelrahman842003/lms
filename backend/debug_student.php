<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$student = \App\Domains\Auth\Models\Student::where('name', 'like', '%عبدالرحمن%')->first();
if (!$student) { echo "Not found\n"; exit; }

echo "Student: {$student->name} | {$student->phone}\n\n";

$svc = new \App\Domains\Application\Services\Student\StudentService();
$teachers = $svc->getEnrolledTeachers($student);

echo "Teachers from getEnrolledTeachers():\n";
foreach ($teachers as $t) {
    echo "  teacher_id: {$t['teacher_id']}\n";
    echo "  teacher_name: {$t['teacher_name']}\n";
    echo "  is_suspended: " . ($t['is_suspended'] ? 'TRUE ❌' : 'false ✅') . "\n";
    echo "  status: {$t['status']}\n";
    echo "  days_left: {$t['days_left']}\n\n";
}
