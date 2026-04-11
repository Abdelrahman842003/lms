<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Domains\Application\Models\Setting;
$setting = Setting::firstOrCreate(['key' => 'cloudflare_r2_bucket']);
$setting->value = 'neetaq';
$setting->save();
echo "Updated cloudflare_r2_bucket\n";
