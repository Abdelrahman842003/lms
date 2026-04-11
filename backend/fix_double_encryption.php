<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Domains\Application\Models\Setting;
use Illuminate\Support\Facades\Crypt;

$setting = Setting::where('key', 'cloudflare_r2_bucket')->first();
if ($setting) {
    $decrypted = $setting->value;
    try {
        if (strpos($decrypted, 'eyJpdiI6') === 0) {
            $real_val = Crypt::decryptString($decrypted);
            echo "Real value: $real_val\n";
            $setting->update(['value' => $real_val]);
            echo "Fixed!\n";
        }
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
