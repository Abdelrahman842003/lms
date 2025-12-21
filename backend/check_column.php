<?php

// Simple script to check if is_suspended column exists
putenv('CACHE_STORE=array');
putenv('SESSION_DRIVER=array');
putenv('QUEUE_CONNECTION=sync');

require __DIR__.'/vendor/autoload.php';

try {
    $app = require __DIR__.'/bootstrap/app.php';
    $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    
    // Get database connection
    $db = DB::connection();
    
    // Check if column exists
    $columns = $db->select("SHOW COLUMNS FROM teachers LIKE 'is_suspended'");
    
    if (empty($columns)) {
        echo "❌ ERROR: Column 'is_suspended' does NOT exist in teachers table!\n";
        echo "\nYou need to run the migration:\n";
        echo "  php artisan migrate\n";
        echo "\nOr execute the SQL script:\n";
        echo "  ALTER TABLE teachers ADD COLUMN is_suspended TINYINT(1) NOT NULL DEFAULT 0 AFTER password;\n";
        exit(1);
    }
    
    echo "✅ SUCCESS: Column 'is_suspended' exists in teachers table!\n";
    echo "\nColumn details:\n";
    print_r($columns[0]);
    
    // Test with a teacher
    $teacher = App\Models\Teacher::first();
    if ($teacher) {
        echo "\n\nTesting with first teacher:\n";
        echo "  ID: {$teacher->id}\n";
        echo "  Name: {$teacher->name}\n";
        echo "  is_suspended: " . ($teacher->is_suspended ? 'true (معلق)' : 'false (نشط)') . "\n";
        echo "  Type: " . gettype($teacher->is_suspended) . "\n";
    } else {
        echo "\n\nNo teachers found in database.\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
