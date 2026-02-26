<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
class EndExpiredLectures extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'lectures:end-expired';
    protected $description = 'End lectures that have passed their end time';

    public function handle()
    {
        $this->info('Checking for expired lectures...');

        $expiredLectures = \App\Domains\Lectures\Models\Lecture::where('is_active', true)
            ->where('end_time', '<', now())
            ->get();

        $this->info("Found {$expiredLectures->count()} expired lectures.");

        $lectureService = app(\App\Domains\Application\Services\Teacher\LectureService::class);

        foreach ($expiredLectures as $lecture) {
            $this->info("Ending lecture: {$lecture->title} (ID: {$lecture->id})");
            $lectureService->endLecture($lecture);
        }

        $this->info('Done.');
    }
}
