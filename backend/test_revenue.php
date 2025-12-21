<?php
// Test script to verify revenue calculation
// Run with: php test_revenue.php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Revenue Calculation Debug ===\n\n";

// Get price per student
$pricePerStudent = \App\Models\Setting::where('key', 'pricePerStudent')->value('value');
echo "Price per Student: " . ($pricePerStudent ?? 'NOT SET') . "\n\n";

// Count total enrollments
$totalEnrollments = \App\Models\Enrollment::count();
echo "Total Enrollments in DB: " . $totalEnrollments . "\n";

// Count unique students
$totalStudents = \App\Models\Student::count();
echo "Total Unique Students: " . $totalStudents . "\n";

// Get each teacher's students count
echo "\n=== Teachers Breakdown ===\n";
$teachers = \App\Models\Teacher::withCount('students')->get();
$sumOfStudents = 0;

foreach ($teachers as $teacher) {
    echo "- {$teacher->name}: {$teacher->students_count} students\n";
    $sumOfStudents += $teacher->students_count;
}

echo "\nSum of all teachers' students: " . $sumOfStudents . "\n";
echo "Expected Revenue: " . ($sumOfStudents * $pricePerStudent) . "\n";

// What DashboardService returns
$dashboardService = new \App\Services\Admin\DashboardService();
$stats = $dashboardService->getStats();

echo "\n=== DashboardService Stats ===\n";
print_r($stats);
