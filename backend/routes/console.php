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

// Disabled: Lectures now use pure Queue-based scheduling via LectureObserver
// The CheckLectureStatus command is still available for manual recovery: php artisan lectures:check-status
// \Illuminate\Support\Facades\Schedule::command('lectures:check-status')->everyMinute();

Artisan::command('debug:pdf', function () {
    try {
        $lecture = \App\Models\Lecture::with(['grade', 'group'])->first();
        if (!$lecture) {
            $this->error('No lecture found');
            return;
        }
        
        $data = [
            'lecture' => $lecture,
            'attendees' => collect([]),
            'total_present' => 0,
            'total_absent' => 0,
            'date' => now()->format('Y-m-d'),
        ];
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('exports.attendees', $data);
        $pdf->setPaper('a4', 'portrait');
        $pdf->setOptions(['defaultFont' => 'dejavu sans', 'isRemoteEnabled' => true]);
        $pdf->save(storage_path('test.pdf'));
        $this->info('PDF Generated Successfully at ' . storage_path('test.pdf'));
    } catch (\Throwable $e) {
        $this->error('Error: ' . $e->getMessage());
        $this->error($e->getTraceAsString());
    }
});
