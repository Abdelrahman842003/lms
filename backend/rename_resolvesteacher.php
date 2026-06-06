<?php

$dir = __DIR__ . '/app/Domains/Application/Http/Controllers';
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));

$replacements = 0;

foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() === 'php') {
        $content = file_get_contents($file->getPathname());
        $originalContent = $content;

        $content = str_replace('getTeacherFromRequest', 'getProfileFromRequest', $content);

        if ($content !== $originalContent) {
            file_put_contents($file->getPathname(), $content);
            $replacements++;
            echo "Updated: " . $file->getBasename() . "\n";
        }
    }
}
echo "Renamed in $replacements files.\n";
