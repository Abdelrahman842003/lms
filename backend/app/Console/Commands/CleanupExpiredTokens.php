<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;

class CleanupExpiredTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tokens:cleanup {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired personal access tokens from the database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $this->info('Starting expired token cleanup...');

        // Count expired tokens
        $expiredCount = PersonalAccessToken::where('expires_at', '<', now())->count();

        if ($expiredCount === 0) {
            $this->info('No expired tokens found.');

            return Command::SUCCESS;
        }

        $this->info("Found {$expiredCount} expired token(s).");

        if ($dryRun) {
            $this->warn('Dry run mode - no tokens will be deleted.');

            // Show sample of tokens that would be deleted
            $sample = PersonalAccessToken::where('expires_at', '<', now())
                ->select(['id', 'name', 'expires_at'])
                ->limit(5)
                ->get();

            $this->table(
                ['ID', 'Name', 'Expired At'],
                $sample->map(fn ($token) => [
                    $token->id,
                    $token->name,
                    $token->expires_at?->toDateTimeString(),
                ])
            );

            if ($expiredCount > 5) {
                $this->info("... and " . ($expiredCount - 5) . " more.");
            }

            return Command::SUCCESS;
        }

        // Delete expired tokens
        $deleted = PersonalAccessToken::where('expires_at', '<', now())->delete();

        $this->info("Successfully deleted {$deleted} expired token(s).");

        // Log the cleanup
        Log::info('Token cleanup completed', [
            'deleted_count' => $deleted,
            'executed_at' => now()->toIso8601String(),
        ]);

        return Command::SUCCESS;
    }
}
