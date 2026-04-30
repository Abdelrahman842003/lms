<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class CleanupSystem extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'system:cleanup {--days=1 : Delete files older than X days} {--silent : Do not output to console}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cleanup temporary files and incomplete video chunks with reporting';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $days = (int) $this->option('days');
        $seconds = $days * 24 * 60 * 60;
        $threshold = time() - $seconds;

        $stats = [
            'files_removed' => 0,
            'bytes_freed' => 0,
            'directories_cleaned' => 0,
        ];

        if (!$this->option('silent')) {
            $this->info("Starting System Cleanup (Target: older than {$days} day(s))...");
        }

        // 1. Cleanup storage/app/tmp
        $this->cleanupDirectory(storage_path('app/tmp'), $threshold, $stats);
        
        // 2. Cleanup storage/app/public/temp (if exists)
        $this->cleanupDirectory(storage_path('app/public/temp'), $threshold, $stats);

        // 3. Cleanup specific video processing temp
        $this->cleanupDirectory(storage_path('app/tmp/videos'), $threshold, $stats);

        $report = $this->generateReport($stats, $days);

        if (!$this->option('silent')) {
            $this->table(['Metric', 'Value'], [
                ['Files Removed', $stats['files_removed']],
                ['Space Freed', $this->formatBytes($stats['bytes_freed'])],
                ['Directories Cleaned', $stats['directories_cleaned']],
            ]);
            $this->info('Cleanup completed successfully.');
        }

        // Log the report for admin visibility
        Log::channel('daily')->info("SYSTEM CLEANUP REPORT:\n" . $report);
        
        // Potential future: Send to Telegram/Slack
        // $this->notifyAdmin($report);
    }

    private function cleanupDirectory(string $path, int $threshold, array &$stats): void
    {
        if (!File::isDirectory($path)) {
            return;
        }

        $files = File::allFiles($path);

        foreach ($files as $file) {
            if ($file->getMTime() < $threshold) {
                $stats['bytes_freed'] += $file->getSize();
                File::delete($file->getPathname());
                $stats['files_removed']++;
            }
        }

        // Clean empty subdirectories
        $directories = File::directories($path);
        foreach ($directories as $dir) {
            if (count(File::allFiles($dir)) === 0 && count(File::directories($dir)) === 0) {
                File::deleteDirectory($dir);
                $stats['directories_cleaned']++;
            }
        }
    }

    private function generateReport(array $stats, int $days): string
    {
        $date = now()->toDateTimeString();
        $size = $this->formatBytes($stats['bytes_freed']);
        
        return <<<REPORT
Date: {$date}
Retention Policy: > {$days} days
Files Deleted: {$stats['files_removed']}
Space Recovered: {$size}
Directories Pruned: {$stats['directories_cleaned']}
Status: SUCCESS
REPORT;
    }

    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= (1 << (10 * $pow));

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
