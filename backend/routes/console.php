<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

\Illuminate\Support\Facades\Schedule::command('tokens:clean')->daily();
\Illuminate\Support\Facades\Schedule::command('notifications:clean')->daily();
\Illuminate\Support\Facades\Schedule::command('lectures:end-expired')->everyMinute();
\Illuminate\Support\Facades\Schedule::command('exams:end-expired')->everyMinute();
\Illuminate\Support\Facades\Schedule::command('payments:expire')->daily();
