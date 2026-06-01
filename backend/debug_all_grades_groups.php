<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;

echo "--- ALL GRADES IN DB ---\n";
$grades = Grade::all();
foreach ($grades as $grade) {
    echo "- Name: {$grade->name} (ID: {$grade->id}), Teacher ID: " . ($grade->teacher_id ?? 'NULL') . ", Academy ID: " . ($grade->academy_id ?? 'NULL') . "\n";
}

echo "\n--- ALL GROUPS IN DB ---\n";
$groups = Group::all();
foreach ($groups as $group) {
    echo "- Name: {$group->name} (ID: {$group->id}), Teacher ID: " . ($group->teacher_id ?? 'NULL') . ", Academy ID: " . ($group->academy_id ?? 'NULL') . "\n";
}
