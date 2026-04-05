<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\Video\StoreVideoRequest;
use App\Domains\Application\Http\Requests\Academy\Video\UpdateVideoRequest;
use App\Domains\Application\Http\Requests\Academy\Video\UploadAttachmentsRequest;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Videos\DTOs\CreateVideoData;
use App\Domains\Videos\DTOs\UpdateVideoData;
use App\Domains\Videos\Models\VideoComment;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAttachment;
use App\Domains\Videos\Policies\VideoPolicy;
use App\Domains\Videos\Resources\VideoCommentResource;
use App\Domains\Videos\Resources\VideoResource;
use App\Domains\Videos\Services\VideoActorResolverService;
use App\Domains\Videos\Services\VideoInteractionService;
use App\Domains\Videos\Services\VideoLifecycleService;
use App\Domains\Videos\Services\VideoQuizService;
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
        private readonly VideoQuizService $quizService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $actor = $this->resolveActor($request);
        $academyId = $this->resolveAcademyId($request);

        $context = $this->actorResolver->resolveAcademyContext($actor, $academyId);
        $videos = $this->lifecycle->listForOwner(
            context: $context,
            filters: $request->only(['status', 'grade_id', 'group_id', 'search', 'published_from', 'published_to']),
            perPage: (int) $request->input('per_page', 15),
        );

        return $this->successResponse(VideoResource::collection($videos)->response()->getData(true));
    }

    public function store(StoreVideoRequest $request): JsonResponse
    {
        $actor = $this->resolveActor($request);
        $academyId = $this->resolveAcademyId($request);

        if (! $this->policy->createAcademy($actor, $academyId)) {
            throw new AuthorizationException('غير مصرح لك برفع فيديوهات للأكاديمية.');
        }

        $context = $this->actorResolver->resolveAcademyUpload(
            actor: $actor,
            academyId: $academyId,
            teacherReferenceId: $request->validated('teacher_reference_id'),
        );

        $video = $this->lifecycle->createVideo(CreateVideoData::fromArray($request->validated()), $context);

        return $this->successResponse([
            'video' => new VideoResource($video),
        ], 'تم رفع الفيديو وبدء المعالجة.', 201);
    }

    public function show(Request $request, Video $video): JsonResponse
    {
        $actor = $this->resolveActor($request);

        if (! $this->policy->view($actor, $video)) {
            throw new AuthorizationException('غير مصرح بعرض هذا الفيديو.');
        }

        $video->load([
            'groups',
            'attachments',
            'grade',
            'teacherReference',
            'watchProgresses.student:id,name',
            'quiz.questions',
            'quiz.attempts.student:id,name',
        ])->loadCount(['likes', 'comments', 'attachments', 'watchProgresses']);

        return $this->successResponse([
            'video' => new VideoResource($video),
        ]);
    }

    public function update(UpdateVideoRequest $request, Video $video): JsonResponse
    {
        $actor = $this->resolveActor($request);

        if (! $this->policy->update($actor, $video)) {
            throw new AuthorizationException('غير مصرح بتعديل هذا الفيديو.');
        }

        $updated = $this->lifecycle->updateVideo($video, UpdateVideoData::fromArray($request->validated()), $actor);

        // ─── معالجة التدريب المرفق مع التعديل ──────────────────────
        if ($request->has('quiz')) {
            $quizData = $request->input('quiz');
            $teacher  = $updated->teacherReference;

            if ($quizData === null) {
                $existingQuiz = $updated->quiz()->first();
                if ($existingQuiz) {
                    $this->quizService->deleteQuiz($existingQuiz);
                }
            } elseif ($teacher) {
                $existingQuiz = $updated->quiz()->first();
                if ($existingQuiz) {
                    $this->quizService->updateQuiz($existingQuiz, $quizData);
                } else {
                    $this->quizService->createQuiz($updated, $teacher, $quizData);
                }
            }
        }

        $updated->load(['groups', 'attachments', 'grade', 'quiz.questions'])
                ->loadCount(['likes', 'comments', 'attachments']);

        return $this->successResponse([
            'video' => new VideoResource($updated),
        ], 'تم تحديث الفيديو بنجاح.');
    }

    public function uploadAttachments(UploadAttachmentsRequest $request, Video $video): JsonResponse
    {
        $actor = $this->resolveActor($request);

        if (! $this->policy->update($actor, $video)) {
            throw new AuthorizationException('غير مصرح برفع مرفقات لهذا الفيديو.');
        }

        $updated = $this->lifecycle->addAttachments(
            $video,
            $request->file('attachments') ?? [],
            $actor,
        );

        return $this->successResponse([
            'video' => new VideoResource($updated),
        ], 'تم رفع المرفقات بنجاح.');
    }

    public function deleteAttachment(Request $request, Video $video, VideoAttachment $attachment): JsonResponse
    {
        $actor = $this->resolveActor($request);

        if (! $this->policy->update($actor, $video)) {
            throw new AuthorizationException('غير مصرح بحذف مرفقات هذا الفيديو.');
        }

        if ((string) $attachment->video_id !== (string) $video->id) {
            abort(404);
        }

        $this->lifecycle->removeAttachment($video, $attachment, $actor);

        return $this->successResponse([], 'تم حذف المرفق بنجاح.');
    }

    public function destroy(Request $request, Video $video): JsonResponse
    {
        $actor = $this->resolveActor($request);

        if (! $this->policy->delete($actor, $video)) {
            throw new AuthorizationException('غير مصرح بحذف هذا الفيديو.');
        }

        $this->lifecycle->delete($video, $actor);

        return $this->successResponse([
            'message' => 'تم حذف الفيديو.',
        ]);
    }

    public function retryProcessing(Request $request, Video $video): JsonResponse
    {
        $actor = $this->resolveActor($request);

        if (! $this->policy->update($actor, $video)) {
            throw new AuthorizationException('غير مصرح بإعادة المعالجة.');
        }

        $this->lifecycle->retryProcessing($video);

        return $this->successResponse([
            'message' => 'تمت جدولة إعادة المعالجة.',
        ]);
    }

    public function publish(Request $request, Video $video): JsonResponse
    {
        $actor = $this->resolveActor($request);

        if (! $this->policy->publish($actor, $video)) {
            throw new AuthorizationException('غير مصرح بنشر الفيديو.');
        }

        $published = $this->lifecycle->publish($video, $actor);

        return $this->successResponse([
            'video' => new VideoResource($published),
        ], 'تم نشر الفيديو بنجاح.');
    }

    public function comments(Request $request, Video $video): JsonResponse
    {
        $actor = $this->resolveActor($request);

        if (! $this->policy->manageComments($actor, $video)) {
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
        $actor = $this->resolveActor($request);

        if (! $this->policy->manageComments($actor, $video)) {
            throw new AuthorizationException('غير مصرح بإدارة التعليقات.');
        }

        $comment = VideoComment::query()->where('video_id', $video->id)->withTrashed()->findOrFail($commentId);
        $comment = $this->interaction->hideComment($comment, $actor);

        return $this->successResponse([
            'comment' => new VideoCommentResource($comment->load('author', 'replies.author')),
        ], 'تم إخفاء التعليق.');
    }

    public function deleteComment(Request $request, Video $video, string $commentId): JsonResponse
    {
        $actor = $this->resolveActor($request);

        if (! $this->policy->manageComments($actor, $video)) {
            throw new AuthorizationException('غير مصرح بإدارة التعليقات.');
        }

        $comment = VideoComment::query()->where('video_id', $video->id)->withTrashed()->findOrFail($commentId);
        $this->interaction->deleteComment($comment);

        return $this->successResponse([
            'message' => 'تم حذف التعليق.',
        ]);
    }

    private function resolveActor(Request $request): Academy|Secretary
    {
        $user = $request->user();

        if (! $user instanceof Academy && ! $user instanceof Secretary) {
            throw new AuthorizationException('الحساب الحالي غير مصرح له.');
        }

        return $user;
    }

    private function resolveAcademyId(Request $request): ?string
    {
        $academyId = $request->header('X-Academy-Id') ?: $request->input('academy_id');

        return $academyId ? (string) $academyId : null;
    }
}
