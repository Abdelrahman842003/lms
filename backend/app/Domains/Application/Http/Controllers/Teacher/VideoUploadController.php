<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Video\AbortUploadRequest;
use App\Domains\Application\Http\Requests\Teacher\Video\InitiateUploadRequest;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\DTOs\CreateVideoData;
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
     * Returns Cloudflare Stream TUS upload URL.
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
            data:            $data,
            context:         $context,
            fileDeclaration: $request->only(['file_name', 'file_size', 'file_mime', 'estimated_duration_minutes', 'file_fingerprint']),
            initiatorIp:     (string) $request->ip(),
        );

        return $this->successResponse($payload, 'تم تهيئة جلسة الرفع. استخدم رابط TUS للرفع المباشر.', 201);
    }

    /**
     * DELETE /api/v1/teacher/videos/abort-upload
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

        return $this->successResponse([], 'تم إلغاء الرفع وتنظيف البيانات من Cloudflare.');
    }

    /**
     * POST /api/v1/teacher/videos/{video}/attachments/initiate-direct-upload
     */
    public function initiateAttachmentUploads(Request $request, \App\Domains\Videos\Models\Video $video): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        if (! $this->policy->update($teacher, $video)) {
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
     * POST /api/v1/teacher/videos/{video}/attachments/complete-direct-upload
     */
    public function completeAttachmentUploads(Request $request, \App\Domains\Videos\Models\Video $video): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        if (! $this->policy->update($teacher, $video)) {
            throw new AuthorizationException('غير مصرح لك بإكمال رفع مرفقات لهذا الفيديو.');
        }

        $request->validate([
            'attachments'            => ['required', 'array', 'min:1'],
            'attachments.*.name'      => ['required', 'string'],
            'attachments.*.file_path' => ['required', 'string'],
            'attachments.*.mime_type' => ['required', 'string'],
            'attachments.*.file_size' => ['required', 'integer'],
        ]);

        $context = $this->actorResolver->resolveIndependentTeacher($teacher);

        $this->orchestration->completeAttachmentUploads($video, $request->input('attachments'), $context);

        return $this->successResponse([], 'تم حفظ المرفقات بنجاح.');
    }
}
