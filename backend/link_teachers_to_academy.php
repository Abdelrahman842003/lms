<?php

// Script to link teachers with enrollments to the academy

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Academy;
use App\Models\Teacher;
use App\Models\Enrollment;

// Get the first academy
$academy = Academy::first();

if (!$academy) {
    echo "No academy found!\n";
    exit(1);
}

echo "Academy: {$academy->name} (ID: {$academy->id})\n\n";

// Get all teachers who have enrollments but are not linked to any academy
$teachers = Teacher::whereHas('enrollments')
    ->whereDoesntHave('academies')
    ->get();

echo "Found {$teachers->count()} teachers with enrollments but not linked to any academy:\n\n";

foreach ($teachers as $teacher) {
    $enrollmentsCount = $teacher->enrollments()->count();
    echo "- {$teacher->name} (ID: {$teacher->id}) - {$enrollmentsCount} enrollments\n";
    
    // Link teacher to academy
    $academy->teachers()->attach($teacher->id, [
        'is_active' => true,
        'joined_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    
    echo "  ✓ Linked to academy\n";
}

echo "\nDone! All teachers are now linked to the academy.\n";
