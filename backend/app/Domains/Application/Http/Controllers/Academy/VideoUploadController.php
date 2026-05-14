<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\Video\AbortUploadRequest;
use App\Domains\Application\Http\Requests\Academy\Video\InitiateUploadRequest;
use App\Domains\Auth\Models\Academy;
use App\Domains\Videos\DTOs\CreateVideoData;
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
        private readonly \App\Domains\Videos\Policies\VideoPolicy $policy,
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
            fileDeclaration: $request->only(['file_name', 'file_size', 'file_mime', 'estimated_duration_minutes', 'file_fingerprint']),
            initiatorIp:     (string) $request->ip(),
        );

        return $this->successResponse($payload, 'تم تهيئة جلسة الرفع بنجاح.', 201);
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
     * POST /api/v1/academy/videos/{video}/attachments/initiate-direct-upload
     */
    public function initiateAttachmentUploads(Request $request, \App\Domains\Videos\Models\Video $video): JsonResponse
    {
        /** @var Academy|\App\Domains\Auth\Models\Secretary $user */
        $user = $request->user();
        $academyId = $request->header('X-Academy-Id');

        $context = $this->actorResolver->resolveAcademyUpload($user, $academyId);

        if (! $this->policy->update($user, $video)) {
            throw new AuthorizationException('غير مصرح لك برفع مرفقات لهذا الفيديو.');
        }

        $request->validate([
            'files'        => ['required', 'array', 'min:1'],
            'files.*.name' => ['required', 'string'],
            'files.*.mime' => ['required', 'string'],
            'files.*.size' => ['required', 'integer'],
        ]);

        $payload = $this->orchestration->initiateAttachmentUploads($video, $request->input('files'));

        return $this->successResponse($payload, 'تم تهيئة روابط رفع المرفقات.');
    }

    /**
     * POST /api/v1/academy/videos/{video}/attachments/complete-direct-upload
     */
    public function completeAttachmentUploads(Request $request, \App\Domains\Videos\Models\Video $video): JsonResponse
    {
        /** @var Academy|\App\Domains\Auth\Models\Secretary $user */
        $user = $request->user();
        $academyId = $request->header('X-Academy-Id');

        $context = $this->actorResolver->resolveAcademyUpload($user, $academyId);

        if (! $this->policy->update($user, $video)) {
            throw new AuthorizationException('غير مصرح لك بإكمال رفع مرفقات لهذا الفيديو.');
        }

        $request->validate([
            'attachments'            => ['required', 'array', 'min:1'],
            'attachments.*.name'      => ['required', 'string'],
            'attachments.*.file_path' => ['required', 'string'],
            'attachments.*.mime_type' => ['required', 'string'],
            'attachments.*.file_size' => ['required', 'integer'],
        ]);

        $this->orchestration->completeAttachmentUploads($video, $request->input('attachments'), $context);

        return $this->successResponse([], 'تم حفظ المرفقات بنجاح.');
    }
}
