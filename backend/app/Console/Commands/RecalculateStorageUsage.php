<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Subscriptions\Services\StorageQuotaService;
use Illuminate\Console\Command;

class RecalculateStorageUsage extends Command
{
    protected $signature = 'storage:recalculate
                            {--type= : teacher | academy | all (default: all)}
                            {--id=   : specific teacher/academy ID (optional)}';

    protected $description = 'Recalculate storage_used_bytes for all teachers and academies from actual videos in DB';

    public function __construct(private readonly StorageQuotaService $storageQuota)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $type = $this->option('type') ?? 'all';
        $id   = $this->option('id');

        if (in_array($type, ['teacher', 'all'])) {
            $query = Teacher::query();
            if ($id) {
                $query->where('id', $id);
            }
            $teachers = $query->get();

            $this->info("📦 Processing {$teachers->count()} teacher(s)...");

            foreach ($teachers as $teacher) {
                $before = (int) $teacher->storage_used_bytes;
                $after  = $this->storageQuota->recalculateUsage($teacher);
                $diff   = $after - $before;
                $sign   = $diff >= 0 ? '+' : '';

                $this->line(sprintf(
                    '  Teacher [%s] %s: %s → %s bytes (%s%s)',
                    $teacher->id,
                    $teacher->name ?? 'N/A',
                    number_format($before),
                    number_format($after),
                    $sign,
                    number_format($diff),
                ));
            }
        }

        if (in_array($type, ['academy', 'all'])) {
            $query = Academy::query();
            if ($id) {
                $query->where('id', $id);
            }
            $academies = $query->get();

            $this->info("🏛  Processing {$academies->count()} academy(ies)...");

            foreach ($academies as $academy) {
                $before = (int) $academy->storage_used_bytes;
                $after  = $this->storageQuota->recalculateUsage($academy);
                $diff   = $after - $before;
                $sign   = $diff >= 0 ? '+' : '';

                $this->line(sprintf(
                    '  Academy [%s] %s: %s → %s bytes (%s%s)',
                    $academy->id,
                    $academy->name ?? 'N/A',
                    number_format($before),
                    number_format($after),
                    $sign,
                    number_format($diff),
                ));
            }
        }

        $this->info('✅ Done.');

        return self::SUCCESS;
    }
}
