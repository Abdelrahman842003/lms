<?php

use App\Models\Student;
use App\Models\Enrollment;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$name = "عبدالرحمن عيد علي"; // From screenshot
// Try to find student
$student = Student::where('name', 'like', "%$name%")->first();

if (!$student) {
    echo "Student not found by exact name. Searching for 'Abdelrahman'...\n";
    $student = Student::where('name', 'like', "%Abdelrahman%")->first();
}

if (!$student) {
    echo "Student not found.\n";
    exit;
}

echo "Student: {$student->name} (ID: {$student->id})\n";
echo "Enrollments:\n";

$enrollments = Enrollment::where('student_id', $student->id)->get();

foreach ($enrollments as $enrollment) {
    $teacher = $enrollment->teacher;
    $academy = $enrollment->academy;
    
    echo "--------------------------------------------------\n";
    echo "ID: {$enrollment->id}\n";
    echo "Teacher: {$teacher->name} (ID: {$teacher->id})\n";
    echo "Academy ID: " . ($enrollment->academy_id ?? 'NULL') . "\n";
    echo "Academy Name: " . ($academy ? $academy->name : 'N/A') . "\n";
    echo "Is Active: " . ($enrollment->is_active ? 'Yes' : 'No') . "\n";
    echo "Subscription End: " . ($enrollment->subscription_end ?? 'NULL') . "\n";
    
    // Check if this teacher has other enrollments for this student
    $otherEnrollments = Enrollment::where('student_id', $student->id)
        ->where('teacher_id', $teacher->id)
        ->where('id', '!=', $enrollment->id)
        ->count();
        
    if ($otherEnrollments > 0) {
        echo "WARNING: This student has $otherEnrollments OTHER enrollments with this same teacher!\n";
    }
}
