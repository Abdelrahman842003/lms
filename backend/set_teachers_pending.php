<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Teacher;

// Set Teacher 2 and Teacher 3 back to pending
$teacher2 = Teacher::where('name', 'Teacher 2')->first();
$teacher3 = Teacher::where('name', 'Teacher 3')->first();

if ($teacher2) {
    $teacher2->update(['status' => 'pending']);
    echo "Teacher 2 set to pending\n";
}

if ($teacher3) {
    $teacher3->update(['status' => 'pending']);
    echo "Teacher 3 set to pending\n";
}

// Show all teachers
$teachers = Teacher::all();
foreach ($teachers as $teacher) {
    echo "- {$teacher->name}: {$teacher->status}\n";
}
