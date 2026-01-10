<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Artisan::command('debug:academy', function () {
    $academy = \App\Models\Academy::first();
    if (!$academy) {
        $this->error('No academy found');
        return;
    }
    $this->info('Academy: ' . $academy->name);
    try {
        $teachers = $academy->teachers()->paginate(10);
        $this->info('Teachers count: ' . $teachers->count());
        foreach ($teachers as $teacher) {
             $this->info('Teacher: ' . $teacher->name);
             // Trigger serialization
             $json = $teacher->toJson();
             $this->info('Serialized: ' . substr($json, 0, 50));
        }
    } catch (\Exception $e) {
        $this->error($e->getMessage());
        $this->error($e->getTraceAsString());
    }
});
