<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use Illuminate\Support\Facades\DB;

$teacher = Teacher::where('name', 'like', '%خالد%')->first();

if (!$teacher) {
    echo "Teacher 'خالد' not found\n";
    exit;
}

echo "Teacher Name: " . $teacher->name . " (ID: " . $teacher->id . ")\n";

// Get academies the teacher is affiliated with
$academies = DB::table('academy_teacher')
    ->join('academies', 'academies.id', '=', 'academy_teacher.academy_id')
    ->where('academy_teacher.teacher_id', $teacher->id)
    ->select('academies.id', 'academies.name', 'academy_teacher.is_active')
    ->get();

echo "\n--- Academies Linked to Teacher ---\n";
foreach ($academies as $ac) {
    echo "- Name: {$ac->name} (ID: {$ac->id}), Active: {$ac->is_active}\n";
}

// Get all academies in database
$allAcademies = DB::table('academies')->select('id', 'name')->get();
echo "\n--- All Academies ---\n";
foreach ($allAcademies as $ac) {
    echo "- Name: {$ac->name} (ID: {$ac->id})\n";
}

// Get teacher's grades and their academy_id
echo "\n--- Teacher's Grades ---\n";
$grades = Grade::where('teacher_id', $teacher->id)->get();
if ($grades->isEmpty()) {
    echo "No grades found for teacher ID {$teacher->id}\n";
} else {
    foreach ($grades as $grade) {
        echo "- Grade: {$grade->name} (ID: {$grade->id}), Academy ID: " . ($grade->academy_id ?? 'NULL') . "\n";
    }
}

// Get teacher's groups and their academy_id
echo "\n--- Teacher's Groups ---\n";
$groups = Group::where('teacher_id', $teacher->id)->get();
if ($groups->isEmpty()) {
    echo "No groups found for teacher ID {$teacher->id}\n";
} else {
    foreach ($groups as $group) {
        echo "- Group: {$group->name} (ID: {$group->id}), Academy ID: " . ($group->academy_id ?? 'NULL') . "\n";
    }
}
