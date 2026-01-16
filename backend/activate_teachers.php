<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Teacher;

// Update all pending teachers to active
$updated = Teacher::where('status', 'pending')->update(['status' => 'active']);

echo "Updated {$updated} teachers from 'pending' to 'active'\n";

// Show all teachers
$teachers = Teacher::all();
foreach ($teachers as $teacher) {
    echo "- {$teacher->name}: {$teacher->status}\n";
}
