<?php

use App\Models\Group;

$groups = Group::latest()->take(5)->get();

foreach ($groups as $group) {
    echo "ID: " . $group->id . " | Name: " . $group->name . " | Academy ID: " . ($group->academy_id ?? 'NULL') . "\n";
}
