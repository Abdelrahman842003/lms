<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Academy;
use App\Models\Teacher;

$academy = Academy::first();
echo "Academy: {$academy->name}\n";
echo "Academy ID: {$academy->id}\n\n";

// Get teachers linked to this academy
$linkedTeachers = $academy->teachers()->get();
echo "Teachers linked to academy via academy_teacher table: {$linkedTeachers->count()}\n";
foreach ($linkedTeachers as $teacher) {
    echo "  - {$teacher->name} (Active: " . ($teacher->pivot->is_active ? 'Yes' : 'No') . ")\n";
}

echo "\n";

// Get all teachers
$allTeachers = Teacher::all();
echo "Total teachers in system: {$allTeachers->count()}\n";
foreach ($allTeachers as $teacher) {
    $enrollments = $teacher->enrollments()->count();
    $academies = $teacher->academies()->count();
    echo "  - {$teacher->name}: {$enrollments} enrollments, linked to {$academies} academies\n";
}
