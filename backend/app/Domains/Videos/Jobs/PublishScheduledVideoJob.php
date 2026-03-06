<?php

declare(strict_types=1);

namespace App\Domains\Videos\Jobs;

use App\Domains\Auth\Models\Admin;
use App\Domains\Videos\Enums\VideoStatus;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Services\VideoLifecycleService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class PublishScheduledVideoJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $videoId,
    ) {}

    public function handle(VideoLifecycleService $lifecycle): void
    {
        $video = Video::query()->find($this->videoId);

        if (! $video) {
            return;
        }

        if ($video->status === VideoStatus::PUBLISHED) {
            return;
        }

        if ($video->scheduled_at && $video->scheduled_at->isFuture()) {
            return;
        }

        $actor = $video->uploader;

        if (! $actor) {
            $actor = Admin::query()->first();
        }

        if (! $actor) {
            // Anonymous system publish.
            $actor = new class
            {
                public ?string $id = null;
            };
        }

        $lifecycle->publish($video, $actor);
    }
}
