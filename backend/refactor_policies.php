<?php

$dir = __DIR__ . '/app/Domains/Application/Policies';
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));

foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() === 'php') {
        $content = file_get_contents($file->getPathname());
        $originalContent = $content;

        // Replace: $model->property->...->teacher_id === $teacher->id;
        // With: $this->ownsProfileResource($teacher, $model->property->...->teacher_profile_id);
        $content = preg_replace_callback(
            '/(\$model(?:->[a-zA-Z0-9_]+)*)->teacher_id\s*===\s*\$([a-zA-Z0-9_]+)->id;/',
            function ($matches) {
                $resource = $matches[1];
                $userVar = $matches[2];
                return "\$this->ownsProfileResource(\${$userVar}, {$resource}->teacher_profile_id);";
            },
            $content
        );

        // Same for `==`
        $content = preg_replace_callback(
            '/(\$model(?:->[a-zA-Z0-9_]+)*)->teacher_id\s*==\s*\$([a-zA-Z0-9_]+)->id;/',
            function ($matches) {
                $resource = $matches[1];
                $userVar = $matches[2];
                return "\$this->ownsProfileResource(\${$userVar}, {$resource}->teacher_profile_id);";
            },
            $content
        );

        // Replace ->where('teacher_id', $teacher->id)
        // With ->where('teacher_profile_id', $teacher->id)
        // WAIT: teacher_id vs teacher_profile_id in DB: teacher_id is UUID, teacher_profile_id is BIGINT.
        // A teacher can have multiple profiles, so checking a single ID is wrong. 
        // For query scopes, we should probably do:
        // ->whereIn('teacher_profile_id', $teacher->profiles()->pluck('id'))
        $content = preg_replace_callback(
            '/->where\(\'teacher_id\',\s*\$([a-zA-Z0-9_]+)->id\)/',
            function ($matches) {
                $userVar = $matches[1];
                return "->whereIn('teacher_profile_id', \${$userVar}->profiles()->pluck('id'))";
            },
            $content
        );

        // $video->teacher_id === $teacher->id;
        $content = preg_replace_callback(
            '/(\$video(?:->[a-zA-Z0-9_]+)*)->teacher_id\s*===\s*\$([a-zA-Z0-9_]+)->id;/',
            function ($matches) {
                $resource = $matches[1];
                $userVar = $matches[2];
                return "\$this->ownsProfileResource(\${$userVar}, {$resource}->teacher_profile_id);";
            },
            $content
        );

        if ($content !== $originalContent) {
            file_put_contents($file->getPathname(), $content);
            echo "Updated: " . $file->getBasename() . "\n";
        }
    }
}
echo "Done.\n";
