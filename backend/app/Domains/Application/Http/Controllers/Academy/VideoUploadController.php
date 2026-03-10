<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\Video\AbortUploadRequest;
use App\Domains\Application\Http\Requests\Academy\Video\CompleteUploadRequest;
use App\Domains\Application\Http\Requests\Academy\Video\InitiateUploadRequest;
use App\Domains\Auth\Models\Academy;
use App\Domains\Videos\DTOs\CreateVideoData;
use App\Domains\Videos\Models\VideoUploadSession;
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
    ) {}

    /**
     * POST /api/v1/academy/videos/initiate-upload
     */
    public function initiateUpload(InitiateUploadRequest $request): JsonResponse
    {
        /** @var Academy $academy */
        $academy = $request->user();

        $context = $this->actorResolver->resolveAcademyUpload(
            $academy,
            (string) $academy->id,
            $request->validated('teacher_reference_id'),
        );

        $data = CreateVideoData::fromInitiateRequest($request->validated());

        $payload = $this->orchestration->initiateUpload(
            data:            $data,
            context:         $context,
            fileDeclaration: $request->only(['file_name', 'file_size', 'file_mime', 'total_parts']),
            initiatorIp:     (string) $request->ip(),
        );

        return $this->successResponse($payload, 'تم تهيئة جلسة الرفع.', 201);
    }

    /**
     * POST /api/v1/academy/videos/complete-upload
     */
    public function completeUpload(CompleteUploadRequest $request): JsonResponse
    {
        /** @var Academy $academy */
        $academy = $request->user();

        $result = $this->orchestration->completeUpload(
            sessionId:    (string) $request->validated('session_id'),
            parts:        (array) $request->validated('parts'),
            uploaderType: $academy->getMorphClass(),
            uploaderId:   (string) $academy->id,
        );

        return $this->successResponse($result, 'تم إكمال الرفع وبدء المعالجة.');
    }

    /**
     * DELETE /api/v1/academy/videos/abort-upload
     */
    public function abortUpload(AbortUploadRequest $request): JsonResponse
    {
        /** @var Academy $academy */
        $academy = $request->user();

        $this->orchestration->abortUpload(
            sessionId:    (string) $request->validated('session_id'),
            uploaderType: $academy->getMorphClass(),
            uploaderId:   (string) $academy->id,
            reason:       (string) ($request->validated('reason') ?? ''),
        );

        return $this->successResponse([], 'تم إلغاء الرفع.');
    }

    /**
     * GET /api/v1/academy/videos/upload-status/{sessionId}
     */
    public function uploadStatus(Request $request, string $sessionId): JsonResponse
    {
        /** @var Academy $academy */
        $academy = $request->user();

        $session = VideoUploadSession::query()->findOrFail($sessionId);

        if (! $session->isOwnedBy($academy->getMorphClass(), (string) $academy->id)) {
            throw new AuthorizationException('غير مصرح بعرض هذه الجلسة.');
        }

        return $this->successResponse([
            'session_id'  => $session->id,
            'video_id'    => $session->video_id,
            'status'      => $session->status->value,
            'total_parts' => $session->total_parts,
            'initiated_at' => $session->initiated_at?->toIso8601String(),
            'completed_at' => $session->completed_at?->toIso8601String(),
        ]);
    }
}
