<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Video\StoreVideoRequest;
use App\Domains\Application\Http\Requests\Teacher\Video\UpdateVideoRequest;
use App\Domains\Application\Http\Requests\Teacher\Video\UploadAttachmentsRequest;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Application\Traits\ResolvesTeacher;
use App\Domains\Videos\DTOs\CreateVideoData;
use App\Domains\Videos\DTOs\UpdateVideoData;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAttachment;
use App\Domains\Videos\Models\VideoComment;
use App\Domains\Videos\Resources\VideoCommentResource;
use App\Domains\Videos\Resources\VideoResource;
use App\Domains\Videos\Services\VideoActorResolverService;
use App\Domains\Videos\Services\VideoInteractionService;
use App\Domains\Videos\Services\VideoLifecycleService;
use App\Domains\Videos\Services\VideoQuizService;
use App\Domains\Videos\Services\VideoStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VideoController extends Controller
{
    use ResolvesTeacher;
    use \App\Domains\Application\Http\Controllers\Traits\ResolvesOwnedResources;

    public function __construct(
        private readonly VideoLifecycleService $lifecycle,
        private readonly VideoActorResolverService $actorResolver,
        private readonly VideoInteractionService $interaction,
        private readonly VideoStorageService $storage,
        private readonly VideoQuizService $quizService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $context = $this->actorResolver->resolveIndependentTeacher($teacher);

        $videos = $this->lifecycle->listForOwner(
            context: $context,
            filters: $request->only(['status', 'grade_id', 'group_id', 'search', 'published_from', 'published_to']),
            perPage: (int) $request->input('per_page', 15),
        );

        return $this->successResponse(VideoResource::collection($videos)->response()->getData(true));
    }

    public function store(StoreVideoRequest $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('createIndependent', Video::class);

        $context = $this->actorResolver->resolveIndependentTeacher($teacher);
        $data = CreateVideoData::fromArray($request->validated());

        $video = $this->lifecycle->createVideo($data, $context);

        return $this->successResponse([
            'video' => new VideoResource($video),
        ], 'تم رفع الفيديو وبدء المعالجة.', 201);
    }

    public function show(Request $request, Video $video): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('view', $video);

        $video->load(['owner', 'uploader', 'publishedBy', 'groups', 'attachments', 'grade', 'teacherReference', 'quiz.questions'])
              ->loadCount(['likes', 'comments', 'attachments']);

        return $this->successResponse([
            'video' => new VideoResource($video),
        ]);
    }

    public function update(UpdateVideoRequest $request, Video $video): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('update', $video);

        $updated = $this->lifecycle->updateVideo($video, UpdateVideoData::fromArray($request->validated()), $teacher);

        // ─── معالجة التدريب المرفق مع التعديل ──────────────────────
        if ($request->has('quiz')) {
            $quizData = $request->input('quiz');

            if ($quizData === null) {
                // null = حذف التدريب الموجود
                $existingQuiz = $updated->quiz()->first();
                if ($existingQuiz) {
                    $this->quizService->deleteQuiz($existingQuiz);
                }
            } else {
                $existingQuiz = $updated->quiz()->first();
                if ($existingQuiz) {
                    // تعديل التدريب الموجود
                    $this->quizService->updateQuiz($existingQuiz, $quizData);
                } else {
                    // إنشاء تدريب جديد
                    $this->quizService->createQuiz($updated, $teacher, $quizData);
                }
            }
        }

        // إعادة تحميل الفيديو مع التدريب
        $updated->load(['groups', 'attachments', 'grade', 'quiz.questions'])
                ->loadCount(['likes', 'comments', 'attachments']);

        return $this->successResponse([
            'video' => new VideoResource($updated),
        ], 'تم تحديث الفيديو بنجاح.');
    }

    public function uploadAttachments(UploadAttachmentsRequest $request, Video $video): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('update', $video);

        $updated = $this->lifecycle->addAttachments(
            $video,
            $request->file('attachments') ?? [],
            $teacher,
        );

        return $this->successResponse([
            'video' => new VideoResource($updated),
        ], 'تم رفع المرفقات بنجاح.');
    }

    public function deleteAttachment(Request $request, Video $video, VideoAttachment $attachment): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('update', $video);

        if ((string) $attachment->video_id !== (string) $video->id) {
            abort(404);
        }

        $this->lifecycle->removeAttachment($video, $attachment, $teacher);

        return $this->successResponse([], 'تم حذف المرفق بنجاح.');
    }

    public function destroy(Request $request, Video $video): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('delete', $video);

        $this->lifecycle->delete($video, $teacher);

        return $this->successResponse([
            'message' => 'تم حذف الفيديو.',
        ]);
    }

    public function retryProcessing(Request $request, Video $video): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('update', $video);

        $this->lifecycle->retryProcessing($video);

        return $this->successResponse([
            'message' => 'تمت جدولة إعادة المعالجة.',
        ]);
    }

    public function publish(Request $request, Video $video): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('publish', $video);

        $published = $this->lifecycle->publish($video, $teacher);

        return $this->successResponse([
            'video' => new VideoResource($published),
        ], 'تم نشر الفيديو بنجاح.');
    }

    public function thumbnail(Request $request, Video $video): RedirectResponse|StreamedResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('view', $video);

        if (! $video->thumbnail_path) {
            abort(404, 'Thumbnail not found');
        }

        try {
            $signedUrl = $this->storage->temporaryUrl(
                $video->thumbnail_path,
                now()->addMinutes(30),
                ['ResponseContentType' => 'image/jpeg']
            );

            return redirect()->away($signedUrl);
        } catch (\Throwable) {
            return $this->streamPrivateFile($video->thumbnail_path, 'image/jpeg', false);
        }
    }

    public function thumbnailUrl(Request $request, Video $video): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('view', $video);

        if (! $video->thumbnail_path) {
            return $this->successResponse(['url' => null]);
        }

        try {
            $signedUrl = $this->storage->temporaryUrl(
                $video->thumbnail_path,
                now()->addMinutes(30),
                ['ResponseContentType' => 'image/jpeg']
            );

            return $this->successResponse(['url' => $signedUrl]);
        } catch (\Throwable) {
            return $this->successResponse(['url' => null]);
        }
    }

    public function stream(Request $request, Video $video): RedirectResponse|StreamedResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('view', $video);

        if (! $video->processed_path) {
            abort(404, 'Video file not found');
        }

        try {
            $signedUrl = $this->storage->temporaryUrl(
                $video->processed_path,
                now()->addHour(),
                [
                    'ResponseContentType' => 'video/mp4',
                    'ResponseContentDisposition' => 'inline',
                ]
            );

            return redirect()->away($signedUrl, 302, [
                'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            ]);
        } catch (\Throwable) {
            return $this->streamPrivateFile($video->processed_path, 'video/mp4', false);
        }
    }

    public function streamUrl(Request $request, Video $video): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('view', $video);

        if (! $video->processed_path) {
            return $this->errorResponse('ملف الفيديو غير موجود.', 404);
        }

        try {
            $signedUrl = $this->storage->temporaryUrl(
                $video->processed_path,
                now()->addHour(),
                [
                    'ResponseContentType' => 'video/mp4',
                    'ResponseContentDisposition' => 'inline',
                ]
            );

            return $this->successResponse([
                'url'        => $signedUrl,
                'expires_in' => 3600,
                'mime_type'  => 'video/mp4',
            ]);
        } catch (\Throwable $e) {
            return $this->errorResponse('تعذّر إنشاء رابط المشاهدة.', 500);
        }
    }

    public function comments(Request $request, Video $video): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('manageComments', $video);

        $comments = $video->comments()
            ->with(['author', 'replies.author'])
            ->latest()
            ->paginate((int) $request->input('per_page', 20));

        return $this->successResponse(VideoCommentResource::collection($comments)->response()->getData(true));
    }

    public function hideComment(Request $request, Video $video, string $commentId): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('manageComments', $video);

        $comment = VideoComment::query()->where('video_id', $video->id)->withTrashed()->findOrFail($commentId);
        $comment = $this->interaction->hideComment($comment, $teacher);

        return $this->successResponse([
            'comment' => new VideoCommentResource($comment->load('author', 'replies.author')),
        ], 'تم إخفاء التعليق.');
    }

    public function deleteComment(Request $request, Video $video, string $commentId): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        Gate::authorize('manageComments', $video);

        $comment = VideoComment::query()->where('video_id', $video->id)->withTrashed()->findOrFail($commentId);
        $this->interaction->deleteComment($comment);

        return $this->successResponse([
            'message' => 'تم حذف التعليق.',
        ]);
    }

    private function streamPrivateFile(string $path, string $mimeType, bool $download, ?string $fileName = null): StreamedResponse
    {
        $size = $this->storage->size($path);

        return response()->stream(function () use ($path): void {
            $stream = $this->storage->readStream($path);
            if (! is_resource($stream)) {
                return;
            }

            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Length' => (string) $size,
            'Content-Disposition' => $download
                ? 'attachment; filename="' . ($fileName ?: 'file') . '"'
                : 'inline',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Accept-Ranges' => 'bytes',
        ]);
    }
}
