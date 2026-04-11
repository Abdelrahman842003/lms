<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Domains\Application\Models\Setting;
$setting = Setting::where('key', 'cloudflare_r2_bucket')->first();
echo "Stored: " . $setting->getRawOriginal('value') . "\n";
echo "Read: " . config('filesystems.disks.r2.bucket') . "\n";

