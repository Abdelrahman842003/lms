<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Student\Video\IssuePlaybackTokenRequest;
use App\Domains\Application\Http\Requests\Student\Video\StoreVideoCommentRequest;
use App\Domains\Application\Http\Requests\Student\Video\UpdateWatchProgressRequest;
use App\Domains\Auth\Models\Student;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoComment;
use App\Domains\Videos\Models\VideoWatchProgress;
use App\Domains\Videos\Resources\VideoCommentResource;
use App\Domains\Videos\Resources\VideoResource;
use App\Domains\Videos\Resources\VideoWatchProgressResource;
use App\Domains\Videos\Services\VideoAuthorizationService;
use App\Domains\Videos\Services\VideoInteractionService;
use App\Domains\Videos\Services\VideoPlaybackService;
use App\Domains\Videos\Services\VideoStreamingService;
use App\Domains\Videos\Enums\VideoWatchStatus;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VideoController extends Controller
{
    public function __construct(
        private readonly VideoAuthorizationService $authorization,
        private readonly VideoPlaybackService $playback,
        private readonly VideoStreamingService $streaming,
        private readonly VideoInteractionService $interaction,
    ) {}

    public function index(Request $request): JsonResponse
    {
        /** @var Student $student */
        $student = $request->user();

        $videos = Video::query()
            ->publishedNow()
            ->whereHas('accessGrants', function ($query) use ($student): void {
                $query->where('student_id', $student->id)
                    ->whereNull('revoked_at');
            })
            ->with([
                'owner',
                'uploader',
                'publishedBy',
                'groups',
                'grade',
                'teacherReference',
                'attachments',
                'likes' => fn ($q) => $q->where('student_id', $student->id),
                'watchProgresses' => fn ($q) => $q->where('student_id', $student->id),
            ])
            ->withCount(['likes', 'comments', 'attachments'])
            ->latest('published_at')
            ->paginate((int) $request->input('per_page', 15));

        return $this->successResponse(VideoResource::collection($videos)->response()->getData(true));
    }

    public function show(Request $request, Video $video): JsonResponse
    {
        /** @var Student $student */
        $student = $request->user();

        $this->authorization->assertStudentCanView($video, $student);

        $video->load([
            'owner',
            'uploader',
            'publishedBy',
            'groups',
            'grade',
            'teacherReference',
            'attachments',
            'quiz.questions',
            'likes' => fn ($q) => $q->where('student_id', $student->id),
            'watchProgresses' => fn ($q) => $q->where('student_id', $student->id),
            'comments' => fn ($q) => $q->where('is_hidden', false)->with(['author', 'replies.author'])->latest(),
        ])->loadCount(['likes', 'comments', 'attachments']);

        $progress = VideoWatchProgress::query()
            ->where('video_id', $video->id)
            ->where('student_id', $student->id)
            ->first();

        // Re-evaluate status when mandatory quiz was added after video completion
        if (
            $progress &&
            $progress->status === VideoWatchStatus::COMPLETED &&
            $progress->quiz_passed_at === null
        ) {
            $quiz = $video->quiz;
            if ($quiz && $quiz->is_active && $quiz->is_required) {
                $progress->update(['status' => VideoWatchStatus::WATCHED_PENDING_QUIZ]);
                $progress = $progress->fresh();
            }
        }

        return $this->successResponse([
            'video' => new VideoResource($video),
            'progress' => $progress ? new VideoWatchProgressResource($progress) : null,
            'comments' => VideoCommentResource::collection($video->comments),
        ]);
    }

    public function issuePlaybackToken(IssuePlaybackTokenRequest $request, Video $video): JsonResponse
    {
        /** @var Student $student */
        $student = $request->user();

        if ($request->filled('device_fingerprint')) {
            $request->headers->set('X-Device-Fingerprint', (string) $request->validated('device_fingerprint'));
        }

        if ($request->filled('session_id')) {
            $request->headers->set('X-Session-Id', (string) $request->validated('session_id'));
        }

        $payload = $this->playback->issuePlaybackToken($video, $student, $request);

        return $this->successResponse($payload);
    }

    public function stream(Request $request, Video $video): RedirectResponse|StreamedResponse
    {
        $token = $this->extractPlaybackToken($request);
        $student = $this->streaming->validateTokenAndGetStudent($video, $token);

        return $this->streaming->streamVideo($video, $student);
    }

    /**
     * Return the R2 signed URL as JSON (for the <video> element src).
     * The playback token must be passed as ?token= query parameter.
     */
    public function streamUrl(Request $request, Video $video): JsonResponse
    {
        $token = (string) $request->query('token', '');

        if ($token === '') {
            throw new AuthorizationException('رمز التشغيل مطلوب.');
        }

        $student = $this->streaming->validateTokenAndGetStudent($video, $token);
        $result = $this->streaming->getStreamUrl($video, $student);

        return $this->successResponse($result);
    }

    public function thumbnail(Request $request, Video $video): RedirectResponse|StreamedResponse
    {
        /** @var Student $student */
        $student = $request->user();

        return $this->streaming->getThumbnailStream($video, $student);
    }

    public function attachmentViewUrl(Request $request, Video $video, string $attachmentId): JsonResponse
    {
        /** @var Student $student */
        $student = $request->user();

        $result = $this->streaming->getAttachmentViewUrl($video, $attachmentId, $student);

        return $this->successResponse($result);
    }

    public function downloadAttachment(Request $request, Video $video, string $attachmentId): RedirectResponse|StreamedResponse
    {
        /** @var Student $student */
        $student = $request->user();

        return $this->streaming->downloadAttachment($video, $attachmentId, $student);
    }

    public function updateProgress(UpdateWatchProgressRequest $request, Video $video): JsonResponse
    {
        /** @var Student $student */
        $student = $request->user();

        $this->authorization->assertStudentCanView($video, $student);

        $progress = $this->interaction->updateProgress($video, $student, $request->validated());

        return $this->successResponse([
            'progress' => new VideoWatchProgressResource($progress),
        ]);
    }

    public function toggleLike(Request $request, Video $video): JsonResponse
    {
        /** @var Student $student */
        $student = $request->user();

        $this->authorization->assertStudentCanView($video, $student);

        $result = $this->interaction->toggleLike($video, $student);

        return $this->successResponse($result);
    }

    public function comments(Request $request, Video $video): JsonResponse
    {
        /** @var Student $student */
        $student = $request->user();

        $this->authorization->assertStudentCanView($video, $student);

        $comments = $video->comments()
            ->where('is_hidden', false)
            ->with(['author', 'replies.author'])
            ->latest()
            ->paginate((int) $request->input('per_page', 20));

        return $this->successResponse(VideoCommentResource::collection($comments)->response()->getData(true));
    }

    public function storeComment(StoreVideoCommentRequest $request, Video $video): JsonResponse
    {
        /** @var Student $student */
        $student = $request->user();

        $this->authorization->assertStudentCanView($video, $student);

        $comment = $this->interaction->addComment(
            video: $video,
            author: $student,
            body: $request->validated('body'),
            parentId: $request->validated('parent_id')
        );

        return $this->successResponse([
            'comment' => new VideoCommentResource($comment->load('author', 'replies.author')),
        ], 'تم إضافة التعليق.', 201);
    }

    public function deleteOwnComment(Request $request, Video $video, string $commentId): JsonResponse
    {
        /** @var Student $student */
        $student = $request->user();

        $this->authorization->assertStudentCanView($video, $student);

        $comment = VideoComment::query()
            ->where('video_id', $video->id)
            ->whereKey($commentId)
            ->whereIn('author_type', array_values(array_unique([
                $student::class,
                method_exists($student, 'getMorphClass') ? (string) $student->getMorphClass() : $student::class,
            ])))
            ->where('author_id', $student->id)
            ->firstOrFail();

        $this->interaction->deleteComment($comment);

        return $this->successResponse([
            'message' => 'تم حذف التعليق.',
        ]);
    }

    /**
     * Extract playback token from request (Authorization header or query string).
     */
    private function extractPlaybackToken(Request $request): string
    {
        // Accept token from Authorization header (preferred) or query string
        $token = '';
        $authHeader = (string) $request->header('Authorization', '');
        if (str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
        }

        if ($token === '') {
            $token = (string) $request->query('token', '');
        }

        if ($token === '') {
            throw new AuthorizationException('رمز التشغيل مطلوب. أرسله عبر Authorization: Bearer header.');
        }

        return $token;
    }
}
