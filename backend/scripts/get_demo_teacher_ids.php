<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$t = App\Domains\Auth\Models\Teacher::where('phone','01000000000')->first();
if (! $t) {
    echo "teacher not found\n";
    exit(1);
}

$g = $t->grades()->first();
if (! $g) {
    echo "grade not found\n";
    exit(1);
}

echo "teacher_id={$t->id}\n";
echo "grade_id={$g->id}\n";
