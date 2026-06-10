<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Domains\Lectures\Models\Lecture;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\TeacherProfile;

$academy = Academy::first();
echo "Academy ID: {$academy->id}\n";

$lectures = Lecture::withoutGlobalScopes()->get();
echo "Total Lectures: " . $lectures->count() . "\n";
foreach ($lectures as $l) {
    echo "Lecture {$l->id}: Academy={$l->academy_id}, TeacherProfile={$l->teacher_profile_id}\n";
}

$profileIds = TeacherProfile::where('academy_id', $academy->id)->pluck('id')->toArray();
echo "Academy Profile IDs: " . implode(', ', $profileIds) . "\n";

$query = Lecture::withoutGlobalScopes()
    ->where(function ($q) use ($academy, $profileIds) {
        $q->where('academy_id', $academy->id);
        if (!empty($profileIds)) {
            $q->orWhereIn('teacher_profile_id', $profileIds);
        }
        $q->orWhereHas('teacher', function ($q) use ($academy) {
            $q->whereHas('academies', function ($q) use ($academy) {
                $q->where('academies.id', $academy->id);
            });
        });
    });

echo "Query Matches: " . $query->count() . "\n";
