<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Video\StoreVideoRequest;
use App\Domains\Application\Http\Requests\Teacher\Video\UpdateVideoRequest;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Videos\DTOs\CreateVideoData;
use App\Domains\Videos\DTOs\UpdateVideoData;
use App\Domains\Videos\Models\VideoComment;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Policies\VideoPolicy;
use App\Domains\Videos\Resources\VideoCommentResource;
use App\Domains\Videos\Resources\VideoResource;
use App\Domains\Videos\Services\VideoActorResolverService;
use App\Domains\Videos\Services\VideoInteractionService;
use App\Domains\Videos\Services\VideoLifecycleService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoController extends Controller
{
    public function __construct(
        private readonly VideoLifecycleService $lifecycle,
        private readonly VideoActorResolverService $actorResolver,
        private readonly VideoInteractionService $interaction,
        private readonly VideoPolicy $policy,
    ) {}

    public function index(Request $request): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();
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
        /** @var Teacher $teacher */
        $teacher = $request->user();

        if (! $this->policy->createIndependent($teacher)) {
            throw new AuthorizationException('غير مصرح لك برفع فيديوهات مستقلة.');
        }

        $context = $this->actorResolver->resolveIndependentTeacher($teacher);
        $data = CreateVideoData::fromArray($request->validated());

        $video = $this->lifecycle->createVideo($data, $context);

        return $this->successResponse([
            'video' => new VideoResource($video),
        ], 'تم رفع الفيديو وبدء المعالجة.', 201);
    }

    public function show(Request $request, Video $video): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        if (! $this->policy->view($teacher, $video)) {
            throw new AuthorizationException('غير مصرح بعرض هذا الفيديو.');
        }

        $video->load(['groups', 'attachments', 'grade', 'teacherReference']);

        return $this->successResponse([
            'video' => new VideoResource($video),
        ]);
    }

    public function update(UpdateVideoRequest $request, Video $video): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        if (! $this->policy->update($teacher, $video)) {
            throw new AuthorizationException('غير مصرح بتعديل هذا الفيديو.');
        }

        $updated = $this->lifecycle->updateVideo($video, UpdateVideoData::fromArray($request->validated()), $teacher);

        return $this->successResponse([
            'video' => new VideoResource($updated),
        ], 'تم تحديث الفيديو بنجاح.');
    }

    public function destroy(Request $request, Video $video): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        if (! $this->policy->delete($teacher, $video)) {
            throw new AuthorizationException('غير مصرح بحذف هذا الفيديو.');
        }

        $this->lifecycle->delete($video, $teacher);

        return $this->successResponse([
            'message' => 'تم حذف الفيديو.',
        ]);
    }

    public function retryProcessing(Request $request, Video $video): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        if (! $this->policy->update($teacher, $video)) {
            throw new AuthorizationException('غير مصرح بإعادة المعالجة.');
        }

        $this->lifecycle->retryProcessing($video);

        return $this->successResponse([
            'message' => 'تمت جدولة إعادة المعالجة.',
        ]);
    }

    public function publish(Request $request, Video $video): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        if (! $this->policy->publish($teacher, $video)) {
            throw new AuthorizationException('غير مصرح بنشر الفيديو.');
        }

        $published = $this->lifecycle->publish($video, $teacher);

        return $this->successResponse([
            'video' => new VideoResource($published),
        ], 'تم نشر الفيديو بنجاح.');
    }

    public function comments(Request $request, Video $video): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        if (! $this->policy->manageComments($teacher, $video)) {
            throw new AuthorizationException('غير مصرح بإدارة التعليقات.');
        }

        $comments = $video->comments()
            ->with(['author', 'replies.author'])
            ->latest()
            ->paginate((int) $request->input('per_page', 20));

        return $this->successResponse(VideoCommentResource::collection($comments)->response()->getData(true));
    }

    public function hideComment(Request $request, Video $video, string $commentId): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        if (! $this->policy->manageComments($teacher, $video)) {
            throw new AuthorizationException('غير مصرح بإدارة التعليقات.');
        }

        $comment = VideoComment::query()->where('video_id', $video->id)->withTrashed()->findOrFail($commentId);
        $comment = $this->interaction->hideComment($comment, $teacher);

        return $this->successResponse([
            'comment' => new VideoCommentResource($comment->load('author', 'replies.author')),
        ], 'تم إخفاء التعليق.');
    }

    public function deleteComment(Request $request, Video $video, string $commentId): JsonResponse
    {
        /** @var Teacher $teacher */
        $teacher = $request->user();

        if (! $this->policy->manageComments($teacher, $video)) {
            throw new AuthorizationException('غير مصرح بإدارة التعليقات.');
        }

        $comment = VideoComment::query()->where('video_id', $video->id)->withTrashed()->findOrFail($commentId);
        $this->interaction->deleteComment($comment);

        return $this->successResponse([
            'message' => 'تم حذف التعليق.',
        ]);
    }
}
