<?php

declare(strict_types=1);

namespace App\Domains\Subscriptions\Jobs;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Services\EnrollmentStatusService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class ProcessStudentExpirationsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @param Collection<int, Enrollment> $enrollments
     */
    public function __construct(
        protected Collection $enrollments
    ) {}

    /**
     * Execute the job.
     */
    public function handle(EnrollmentStatusService $statusService): void
    {
        foreach ($this->enrollments as $enrollment) {
            $status = $statusService->getStatus($enrollment);

            if ($status === 'expired' && $enrollment->is_active) {
                $enrollment->update(['is_active' => false]);
                
                // Logic for notifying student could go here
                // e.g., $enrollment->student->notify(new SubscriptionExpiredNotification($enrollment));
            }
        }
    }
}
