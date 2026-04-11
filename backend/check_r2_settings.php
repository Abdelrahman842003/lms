<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach ([
    'cloudflare_r2_access_key_id',
    'cloudflare_r2_secret_access_key',
    'cloudflare_r2_bucket',
    'cloudflare_r2_endpoint',
    'cloudflare_r2_public_url',
    'cloudflare_kv_account_id',
    'cloudflare_kv_namespace_id',
    'cloudflare_kv_api_token'
] as $key) {
    $setting = \App\Domains\Application\Models\Setting::where('key', $key)->first();
    if ($setting) {
        echo "$key: " . $setting->value . "\n";
    }
}
