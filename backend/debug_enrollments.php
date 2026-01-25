<?php

use App\Models\Academy;
use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Get the first academy (assuming it's the one in the screenshot)
$academy = Academy::first();

if (!$academy) {
    echo "No academy found.\n";
    exit;
}

echo "Academy: " . $academy->name . " (ID: " . $academy->id . ")\n";

// Replicate Admin/ReportService logic
$academyTeachers = $academy->activeTeachers()->with('enrollments')->get();

echo "Active Teachers Count: " . $academyTeachers->count() . "\n";

$totalEnrollments = 0;
$activeEnrollments = 0;
$uniqueStudentIds = [];

// Simulate date range (End of Jan 2026)
$endDate = \Carbon\Carbon::create(2026, 1, 31, 23, 59, 59);

foreach ($academyTeachers as $teacher) {
    echo "Teacher: " . $teacher->name . " (ID: " . $teacher->id . ")\n";
    echo "Loaded Enrollments: " . $teacher->enrollments->count() . "\n";
    
    foreach ($teacher->enrollments as $enrollment) {
        // Filter by date to match Academy Report logic (All Active Enrollments up to End Date)
        if ($enrollment->created_at <= $endDate) {
            $totalEnrollments++;
            if ($enrollment->is_active) {
                $activeEnrollments++;
                 echo "  - Active Enrollment: Student " . $enrollment->student_id . " | Created: " . $enrollment->created_at . "\n";
            }
            $uniqueStudentIds[] = $enrollment->student_id;
        }
    }
}

echo "Service Logic - Total Active Enrollments: " . $activeEnrollments . "\n";
echo "Service Logic - Total Unique Students: " . count(array_unique($uniqueStudentIds)) . "\n";




// Collect all enrollments from the loop for analysis
$allEnrollments = collect();
foreach ($academyTeachers as $teacher) {
    foreach ($teacher->enrollments as $enrollment) {
        if ($enrollment->created_at <= $endDate && $enrollment->is_active) {
            $allEnrollments->push($enrollment);
        }
    }
}

// Check for students with multiple enrollments
echo "\n--- Students with Multiple Enrollments ---\n";
$studentCounts = $allEnrollments->groupBy('student_id')->map->count();
$duplicates = $studentCounts->filter(function ($count) {
    return $count > 1;
});

if ($duplicates->isEmpty()) {
    echo "No students have multiple enrollments.\n";
} else {
    foreach ($duplicates as $studentId => $count) {
        echo "Student ID $studentId has $count enrollments.\n";
    }
}
