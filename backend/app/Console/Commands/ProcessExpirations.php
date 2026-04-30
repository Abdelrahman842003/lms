<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Subscriptions\Jobs\ProcessStudentExpirationsJob;
use App\Domains\Subscriptions\Jobs\ProcessTenantExpirationsJob;
use Illuminate\Console\Command;

class ProcessExpirations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'subscriptions:process-expirations {--batch=100 : Number of records per job batch}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Identify and process expired subscriptions for students, teachers, and academies';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $batchSize = (int) $this->option('batch');

        $this->info('Processing student enrollments...');
        Enrollment::query()
            ->where('is_active', true)
            ->whereNotNull('subscription_end')
            ->where('subscription_end', '<', now())
            ->chunk($batchSize, function ($enrollments) {
                ProcessStudentExpirationsJob::dispatch($enrollments);
            });

        $this->info('Processing teacher subscriptions...');
        Teacher::query()
            ->whereNotNull('plan_expires_at')
            ->where('plan_expires_at', '<', now())
            ->chunk($batchSize, function ($teachers) {
                ProcessTenantExpirationsJob::dispatch($teachers);
            });

        $this->info('Processing academy subscriptions...');
        Academy::query()
            ->whereNotNull('plan_expires_at')
            ->where('plan_expires_at', '<', now())
            ->chunk($batchSize, function ($academies) {
                ProcessTenantExpirationsJob::dispatch($academies);
            });

        $this->info('Expiration processing initiated.');
    }
}
