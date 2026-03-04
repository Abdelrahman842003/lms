<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$resources = [
    'AdminResource' => \App\Filament\Resources\AdminResource::class,
    'TeacherResource' => \App\Filament\Resources\TeacherResource::class,
    'StudentResource' => \App\Filament\Resources\StudentResource::class,
    'SecretaryResource' => \App\Filament\Resources\SecretaryResource::class,
    'SubscriptionResource' => \App\Filament\Resources\SubscriptionResource::class,
    'AcademyResource' => \App\Filament\Resources\AcademyResource::class,
    'RoleResource' => \App\Filament\Resources\RoleResource::class,
    'PermissionResource' => \App\Filament\Resources\PermissionResource::class,
];

foreach ($resources as $name => $class) {
    try {
        $reflection = new \ReflectionClass($class);
        $content = file_get_contents($reflection->getFileName());
        
        preg_match_all('/^use\s+([^;]+);/m', $content, $matches);
        $allOk = true;
        foreach ($matches[1] as $usedClass) {
            $usedClass = trim($usedClass);
            if (strpos($usedClass, ' as ') !== false) {
                $usedClass = explode(' as ', $usedClass)[0];
            }
            if (!class_exists($usedClass) && !trait_exists($usedClass) && !interface_exists($usedClass) && !enum_exists($usedClass)) {
                echo "$name: MISSING CLASS $usedClass\n";
                $allOk = false;
            }
        }
        if ($allOk) {
            echo "$name: ALL IMPORTS OK ✓\n";
        }
    } catch (\Throwable $e) {
        echo "$name: ERROR - " . $e->getMessage() . "\n";
    }
}
