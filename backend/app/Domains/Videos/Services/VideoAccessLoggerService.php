<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAccessLog;
use Illuminate\Http\Request;

class VideoAccessLoggerService
{
    /**
     * @param array<string, mixed> $meta
     */
    public function log(
        string $action,
        string $result,
        ?Video $video = null,
        ?string $studentId = null,
        ?Request $request = null,
        ?string $reason = null,
        array $meta = []
    ): void {
        VideoAccessLog::query()->create([
            'video_id' => $video?->id,
            'student_id' => $studentId,
            'action' => $action,
            'result' => $result,
            'reason' => $reason,
            'device_fingerprint' => $request?->header('X-Device-Fingerprint'),
            'session_identifier' => $request?->header('X-Session-Id'),
            'user_agent_hash' => $request ? $this->hashUserAgent((string) $request->userAgent()) : null,
            'ip_address' => $request?->ip(),
            'meta' => $meta,
            'created_at' => now(),
        ]);
    }

    public function hashUserAgent(string $userAgent): string
    {
        return hash('sha256', $userAgent);
    }
}
