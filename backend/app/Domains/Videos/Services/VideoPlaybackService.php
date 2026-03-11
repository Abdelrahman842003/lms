<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Auth\Models\Student;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoPlaybackToken;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VideoPlaybackService
{
    public function __construct(
        private readonly VideoSettingsService $settings,
        private readonly VideoAuthorizationService $authorization,
        private readonly VideoAccessLoggerService $accessLogger,
    ) {}

    /**
     * @return array{token:string,expires_at:string,stream_endpoint:string,watermark:array<string,mixed>}
     */
    public function issuePlaybackToken(Video $video, Student $student, Request $request): array
    {
        $access = $this->authorization->checkStudentViewAccess($video, $student);

        if (! $access['allowed']) {
            $this->accessLogger->log(
                action: 'issue_playback_token',
                result: 'denied',
                video: $video,
                studentId: (string) $student->id,
                request: $request,
                reason: $access['reason']
            );

            throw new AuthorizationException('غير مصرح بتشغيل الفيديو.');
        }

        $deviceFingerprint = $this->resolveDeviceFingerprint($request);
        $sessionId = (string) $request->header('X-Session-Id', '');
        $userAgentHash = $this->accessLogger->hashUserAgent((string) $request->userAgent());

        $this->enforceConcurrentDeviceLimit($student, $deviceFingerprint);

        $rawToken = Str::random(80);
        $hash = hash('sha256', $rawToken);
        $expiresAt = now()->addSeconds($this->settings->playbackTokenTtlSeconds());

        VideoPlaybackToken::query()->create([
            'video_id' => $video->id,
            'student_id' => $student->id,
            'device_fingerprint' => $deviceFingerprint,
            'session_identifier' => $sessionId !== '' ? $sessionId : null,
            'user_agent_hash' => $userAgentHash,
            'ip_address' => $request->ip(),
            'token_hash' => $hash,
            'issued_at' => now(),
            'expires_at' => $expiresAt,
        ]);

        $this->accessLogger->log(
            action: 'issue_playback_token',
            result: 'allowed',
            video: $video,
            studentId: (string) $student->id,
            request: $request,
            meta: [
                'expires_at' => $expiresAt->toIso8601String(),
                'device_fingerprint' => $deviceFingerprint,
            ]
        );

        return [
            'token'      => $rawToken,
            'expires_at' => $expiresAt->toIso8601String(),
            // stream_url intentionally omitted from here.
            // The frontend must send the token in the Authorization header:
            //   GET /api/v1/student/videos/{id}/stream
            //   Authorization: Bearer <playback_token>
            // NOT as a query parameter (prevents token leakage in access logs).
            'stream_endpoint' => url("/api/v1/student/videos/{$video->id}/stream"),
            'watermark' => [
                'enabled' => $this->settings->watermarkEnabled(),
                'rotation_interval_seconds' => $this->settings->watermarkRotationIntervalSeconds(),
                'note' => 'لا يمكن منع تصوير الشاشة 100% على الويب، لكن تم تطبيق وسائل تقليل التسريب عملياً.',
            ],
        ];
    }

    public function validatePlaybackToken(Video $video, Student $student, string $rawToken, Request $request): VideoPlaybackToken
    {
        $tokenHash = hash('sha256', $rawToken);
        $token = VideoPlaybackToken::query()
            ->where('token_hash', $tokenHash)
            ->where('video_id', $video->id)
            ->where('student_id', $student->id)
            ->first();

        if (! $token) {
            $this->accessLogger->log(
                action: 'video_stream',
                result: 'denied',
                video: $video,
                studentId: (string) $student->id,
                request: $request,
                reason: 'token_not_found'
            );
            throw new AuthorizationException('رمز التشغيل غير صالح.');
        }

        if ($token->revoked_at !== null || $token->expires_at->isPast()) {
            $this->accessLogger->log(
                action: 'video_stream',
                result: 'denied',
                video: $video,
                studentId: (string) $student->id,
                request: $request,
                reason: 'token_expired_or_revoked'
            );
            throw new AuthorizationException('انتهت صلاحية رمز التشغيل.');
        }

        $expectedUserAgentHash = $this->accessLogger->hashUserAgent((string) $request->userAgent());
        if (! hash_equals($token->user_agent_hash, $expectedUserAgentHash)) {
            $this->revokeToken($token, 'user_agent_mismatch');
            throw new AuthorizationException('رمز التشغيل غير متوافق مع الجهاز الحالي.');
        }

        $deviceFingerprint = $this->resolveDeviceFingerprint($request);
        if (! hash_equals($token->device_fingerprint, $deviceFingerprint)) {
            $this->revokeToken($token, 'device_mismatch');
            throw new AuthorizationException('رمز التشغيل غير متوافق مع الجهاز الحالي.');
        }

        $token->update(['last_used_at' => now()]);

        $this->accessLogger->log(
            action: 'video_stream',
            result: 'allowed',
            video: $video,
            studentId: (string) $student->id,
            request: $request,
            meta: ['token_id' => $token->id]
        );

        return $token;
    }

    public function revokeAllExpiredTokens(): void
    {
        VideoPlaybackToken::query()
            ->whereNull('revoked_at')
            ->where('expires_at', '<=', now())
            ->update([
                'revoked_at' => now(),
                'revoked_reason' => 'expired',
            ]);
    }

    private function enforceConcurrentDeviceLimit(Student $student, string $deviceFingerprint): void
    {
        $activeDevices = VideoPlaybackToken::query()
            ->where('student_id', $student->id)
            ->active()
            ->distinct('device_fingerprint')
            ->pluck('device_fingerprint');

        $deviceAlreadyActive = $activeDevices->contains($deviceFingerprint);
        $limit = $this->settings->maxConcurrentDevicesPerStudent();

        if (! $deviceAlreadyActive && $activeDevices->count() >= $limit) {
            throw new AuthorizationException('تم تجاوز الحد الأقصى للأجهزة المسموح بها.');
        }
    }

    private function resolveDeviceFingerprint(Request $request): string
    {
        $header = trim((string) $request->header('X-Device-Fingerprint', ''));
        if ($header !== '') {
            return substr($header, 0, 128);
        }

        return substr(hash('sha256', ($request->ip() ?? '') . '|' . (string) $request->userAgent()), 0, 64);
    }

    private function revokeToken(VideoPlaybackToken $token, string $reason): void
    {
        $token->update([
            'revoked_at' => now(),
            'revoked_reason' => $reason,
        ]);
    }
}
