<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Video\AbortUploadRequest;
use App\Domains\Application\Http\Requests\Teacher\Video\CompleteUploadRequest;
use App\Domains\Application\Http\Requests\Teacher\Video\InitiateUploadRequest;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\DTOs\CreateVideoData;
use App\Domains\Videos\Models\VideoUploadSession;
use App\Domains\Videos\Policies\VideoPolicy;
use App\Domains\Videos\Services\VideoActorResolverService;
use App\Domains\Videos\Services\VideoUploadOrchestrationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoUploadController extends Controller
{
    public function __construct(
        private readonly VideoUploadOrchestrationService $orchestration,
        private readonly VideoActorResolverService $actorResolver,
        private readonly VideoPolicy $policy,
    ) {}

    /**
     * POST /api/v1/teacher/videos/initiate-upload
     *
     * Returns presigned part URLs. No video bytes touch the server.
     */
    public function initiateUpload(InitiateUploadRequest $request): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        if (! $this->policy->createIndependent($teacher)) {
            throw new AuthorizationException('غير مصرح لك برفع فيديوهات مستقلة.');
        }

        $context = $this->actorResolver->resolveIndependentTeacher($teacher);
        $data    = CreateVideoData::fromInitiateRequest($request->validated());

        $payload = $this->orchestration->initiateUpload(
            data:         $data,
            context:      $context,
            fileDeclaration: $request->only(['file_name', 'file_size', 'file_mime', 'total_parts']),
            initiatorIp:  (string) $request->ip(),
        );

        return $this->successResponse($payload, 'تم تهيئة جلسة الرفع. ارفع الأجزاء مباشرةً إلى R2.', 201);
    }

    /**
     * POST /api/v1/teacher/videos/complete-upload
     *
     * Finalises the multipart upload on R2 and triggers processing.
     */
    public function completeUpload(CompleteUploadRequest $request): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        $result = $this->orchestration->completeUpload(
            sessionId:    (string) $request->validated('session_id'),
            parts:        (array) $request->validated('parts'),
            uploaderType: $teacher->getMorphClass(),
            uploaderId:   (string) $teacher->id,
        );

        return $this->successResponse($result, 'تم إكمال الرفع وبدء المعالجة.');
    }

    /**
     * DELETE /api/v1/teacher/videos/abort-upload
     *
     * Aborts the multipart upload and cleans up R2 parts.
     */
    public function abortUpload(AbortUploadRequest $request): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        $this->orchestration->abortUpload(
            sessionId:    (string) $request->validated('session_id'),
            uploaderType: $teacher->getMorphClass(),
            uploaderId:   (string) $teacher->id,
            reason:       (string) ($request->validated('reason') ?? ''),
        );

        return $this->successResponse([], 'تم إلغاء الرفع وتنظيف الأجزاء من R2.');
    }

    /**
     * GET /api/v1/teacher/videos/upload-status/{sessionId}
     */
    public function uploadStatus(Request $request, string $sessionId): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        $session = VideoUploadSession::query()->findOrFail($sessionId);

        if (! $session->isOwnedBy($teacher->getMorphClass(), (string) $teacher->id)) {
            throw new AuthorizationException('غير مصرح بعرض هذه الجلسة.');
        }

        return $this->successResponse([
            'session_id' => $session->id,
            'video_id'   => $session->video_id,
            'status'     => $session->status->value,
            'total_parts' => $session->total_parts,
            'initiated_at' => $session->initiated_at?->toIso8601String(),
            'completed_at' => $session->completed_at?->toIso8601String(),
        ]);
    }
}
