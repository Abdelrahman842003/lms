<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DeviceToken;

$tokens = DeviceToken::with('tokenable')->get();

echo "Total Tokens: " . $tokens->count() . "\n";

foreach ($tokens as $token) {
    echo "Token ID: {$token->id}\n";
    echo "Owner Type: {$token->tokenable_type}\n";
    echo "Owner ID: {$token->tokenable_id}\n";
    echo "Device Type: {$token->device_type}\n";
    echo "Token (substr): " . substr($token->token, 0, 20) . "...\n";
    echo "--------------------------------\n";
}
