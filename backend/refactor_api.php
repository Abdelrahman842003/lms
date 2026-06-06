<?php

$directories = [
    __DIR__ . '/app/Domains/Application/Services',
    __DIR__ . '/app/Domains/Application/Http/Controllers',
    __DIR__ . '/app/Domains/Application/Http/Requests',
    __DIR__ . '/app/Domains/Application/Http/Resources',
];

$replacements = 0;

foreach ($directories as $dir) {
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));

    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            $content = file_get_contents($file->getPathname());
            $originalContent = $content;

            // Skip files that deal with the teacher model directly for authentication or registration
            if (strpos($file->getBasename(), 'AuthController') !== false ||
                strpos($file->getBasename(), 'TeacherService') !== false ||
                strpos($file->getBasename(), 'TeacherController') !== false) {
                // For TeacherService and TeacherController, we still need to replace some,
                // but let's be careful. Let's do it manually for these.
                continue;
            }

            // Replace 'teacher_id' with 'teacher_profile_id' in string literals and variables
            // like ->where('teacher_id', ...)
            $content = preg_replace('/(?<!>)teacher_id(?!_)/', 'teacher_profile_id', $content);
            $content = preg_replace('/(?<=\$)teacher_id(?!_)/', 'teacher_profile_id', $content);
            $content = preg_replace('/(?<=\>)teacher_id(?!_)/', 'teacher_profile_id', $content);
            $content = preg_replace('/(?<=\$)teacherId(?!_)/', 'teacherProfileId', $content);
            
            // Fix double replacements if they happen
            $content = str_replace('teacher_profile_profile_id', 'teacher_profile_id', $content);
            $content = str_replace('teacherProfileProfileId', 'teacherProfileId', $content);

            if ($content !== $originalContent) {
                file_put_contents($file->getPathname(), $content);
                $replacements++;
            }
        }
    }
}

echo "Refactored $replacements files.\n";
