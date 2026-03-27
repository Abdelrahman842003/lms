<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\Lectures\Models\Lecture;
use App\Domains\Lectures\Observers\LectureObserver;
use Illuminate\Console\Command;

class SyncLectureJobs extends Command
{
    protected $signature = 'lectures:sync-jobs';
    protected $description = 'Re-evaluate and re-schedule all lecture activation jobs';

    public function handle(LectureObserver $observer)
    {
        $lectures = Lecture::all();
        $this->info("Found {$lectures->count()} lectures to sync.");

        foreach ($lectures as $lecture) {
            $this->info("Syncing lecture: {$lecture->title} ({$lecture->id})");
            $observer->syncLecture($lecture);
        }

        $this->info('Lecture synchronization completed.');
    }
}
