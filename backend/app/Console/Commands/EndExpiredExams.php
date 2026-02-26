<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\Exams\Models\Exam;
use Illuminate\Console\Command;
use App\Domains\Application\Http\Controllers\Teacher\ExamController;

class EndExpiredExams extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exams:end-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'End exams that have exceeded their duration';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $exams = Exam::where('is_active', true)
            ->whereNotNull('activated_at')
            ->get();

        $controller = app(ExamController::class);
        $count = 0;

        foreach ($exams as $exam) {
            // Calculate end time
            $endTime = $exam->activated_at->addMinutes($exam->duration);

            if (now()->greaterThan($endTime)) {
                $this->info("Ending exam: {$exam->title} (ID: {$exam->id})");
                $controller->endExam($exam);
                $count++;
            }
        }

        $this->info("Ended {$count} expired exams.");
    }
}
