<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Domains\Application\Models\Setting;
use Illuminate\Support\Facades\Crypt;

$keys = Setting::$encryptedKeys;
foreach (Setting::whereIn('key', $keys)->get() as $setting) {
    $raw = $setting->getRawOriginal('value');
    $decrypted = $setting->value; // accessor
    
    echo "Key: " . $setting->key . "\n";
    echo "Raw: " . substr($raw, 0, 20) . "...\n";
    echo "Decrypted: " . substr($decrypted, 0, 20) . "...\n";
    
    // Check if decrypted still looks like a laravel encrypted payload
    try {
        if (strpos($decrypted, 'eyJpdiI6') === 0) {
            echo "Twice decrypted: " . Crypt::decryptString($decrypted) . "\n";
        }
    } catch (\Exception $e) {}
    echo "--------------------------\n";
}
