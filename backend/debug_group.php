<?php

use App\Models\Group;
use App\Models\Academy;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$group = Group::with('grade')->where('name', 'مج1ك')->first();

if ($group) {
    echo "Group ID: " . $group->id . "\n";
    echo "Group Name: " . $group->name . "\n";
    echo "Group Academy ID: " . $group->academy_id . "\n";
    echo "Group Teacher ID: " . $group->teacher_id . "\n";
    echo "has Grade: " . ($group->grade ? 'Yes' : 'No') . "\n";
    if ($group->grade) {
        echo "Grade Name: " . $group->grade->name . "\n";
        echo "Grade Academy ID: " . $group->grade->academy_id . "\n";
        echo "Grade Teacher ID: " . $group->grade->teacher_id . "\n";
    }
} else {
    echo "Group not found.\n";
}
