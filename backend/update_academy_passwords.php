<?php

/**
 * Script to update existing academies with passwords
 * Run this with: php update_academy_passwords.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Academy;
use Illuminate\Support\Facades\Hash;

echo "🔄 Updating academy passwords...\n\n";

// Update all academies without passwords
$academies = Academy::whereNull('password')->orWhere('password', '')->get();

if ($academies->isEmpty()) {
    echo "✅ All academies already have passwords!\n";
    exit(0);
}

foreach ($academies as $academy) {
    $academy->password = Hash::make('123456');
    $academy->save();
    
    echo "✅ Updated password for: {$academy->name} ({$academy->phone})\n";
}

echo "\n🎉 Done! Updated {$academies->count()} academies\n";
echo "📱 Default password for all academies: 123456\n";
