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

$s = app(App\Domains\Auth\Services\TokenService::class);
$pair = $s->generateTokenPair($t, 'test-device');

echo "access=" . $pair['access']['access_token'] . PHP_EOL;
echo "refresh=" . $pair['refresh']['refresh_token'] . PHP_EOL;
