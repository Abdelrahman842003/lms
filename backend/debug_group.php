<?php

use App\Models\Group;

$group = Group::where('name', 'like', '%مج 1 م%')->first();

if ($group) {
    echo "Group Found: " . $group->name . "\n";
    echo "ID: " . $group->id . "\n";
    echo "Teacher ID: " . $group->teacher_id . "\n";
    echo "Academy ID: " . ($group->academy_id ?? 'NULL') . "\n";
    
    if ($group->academy_id) {
        echo "WARNING: Group has an Academy ID assigned!\n";
    } else {
        echo "CONFIRMED: Group is Independent (Academy ID is NULL).\n";
    }
} else {
    echo "Group not found.\n";
}
