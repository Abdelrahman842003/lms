<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Student\Video\IssuePlaybackTokenRequest;
use App\Domains\Application\Http\Requests\Student\Video\StoreVideoCommentRequest;
use App\Domains\Application\Http\Requests\Student\Video\UpdateWatchProgressRequest;
use App\Domains\Auth\Models\Student;
use App\Domains\Videos\Models\Video;
use App\Domains\Videos\Models\VideoAttachment;
use App\Domains\Videos\Models\VideoComment;
use App\Domains\Videos\Models\VideoWatchProgress;
use App\Domains\Videos\Resources\VideoCommentResource;
use App\Domains\Videos\Resources\VideoResource;
use App\Domains\Videos\Resources\VideoWatchProgressResource;
use App\Domains\Videos\Services\VideoAuthorizationService;
use App\Domains\Videos\Services\VideoInteractionService;
use App\Domains\Videos\Services\VideoPlaybackService;
use App\Domains\Videos\Services\VideoStorageService;
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
        private readonly VideoStorageService $storage,
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

        // ─── إعادة تقييم الـ status عند وجود quiz إلزامي أُضيف بعد إتمام الفيديو ───
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

        // Resolve student from the playback token (no session cookie required)
        $tokenHash = hash('sha256', $token);
        $playbackToken = \App\Domains\Videos\Models\VideoPlaybackToken::query()
            ->where('token_hash', $tokenHash)
            ->where('video_id', $video->id)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $playbackToken) {
            throw new AuthorizationException('رمز التشغيل غير صالح أو منتهي الصلاحية.');
        }

        /** @var \App\Domains\Auth\Models\Student $student */
        $student = \App\Domains\Auth\Models\Student::findOrFail($playbackToken->student_id);

        $this->authorization->assertStudentCanView($video, $student);

        // Update last_used_at and log access
        $playbackToken->update(['last_used_at' => now()]);

        if (! $video->processed_path || ! $this->storage->exists($video->processed_path)) {
            abort(404, 'Video file not found');
        }

        try {
            $signedUrl = $this->storage->temporaryUrl(
                $video->processed_path,
                \Illuminate\Support\Carbon::now()->addSeconds(45),
                [
                    'ResponseContentType' => 'video/mp4',
                    'ResponseContentDisposition' => 'inline',
                ]
            );

            return redirect()->away($signedUrl, 302, [
                'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma' => 'no-cache',
            ]);
        } catch (\Throwable) {
            return $this->streamPrivateFile($video->processed_path, 'video/mp4', false);
        }
    }

    /**
     * Return the R2 signed URL as JSON (for the <video> element src).
     * The playback token must be passed as ?token= query parameter.
     * (The Authorization header carries the Sanctum session token, NOT the playback token.)
     */
    public function streamUrl(Request $request, Video $video): JsonResponse
    {
        // Read playback token ONLY from the query string.
        // The Authorization header is already used by Sanctum for session auth and must NOT
        // be treated as a playback token.
        $token = (string) $request->query('token', '');

        if ($token === '') {
            throw new AuthorizationException('رمز التشغيل مطلوب.');
        }

        $tokenHash = hash('sha256', $token);
        $playbackToken = \App\Domains\Videos\Models\VideoPlaybackToken::query()
            ->where('token_hash', $tokenHash)
            ->where('video_id', $video->id)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $playbackToken) {
            throw new AuthorizationException('رمز التشغيل غير صالح أو منتهي الصلاحية.');
        }

        /** @var \App\Domains\Auth\Models\Student $student */
        $student = \App\Domains\Auth\Models\Student::findOrFail($playbackToken->student_id);

        $this->authorization->assertStudentCanView($video, $student);

        $playbackToken->update(['last_used_at' => now()]);

        if (! $video->processed_path || ! $this->storage->exists($video->processed_path)) {
            abort(404, 'Video file not found');
        }

        // Generate a signed URL valid for 1 hour (enough for a full playback session)
        $signedUrl = $this->storage->temporaryUrl(
            $video->processed_path,
            \Illuminate\Support\Carbon::now()->addHour(),
            [
                'ResponseContentType' => 'video/mp4',
                'ResponseContentDisposition' => 'inline',
            ]
        );

        return $this->successResponse(['url' => $signedUrl]);
    }

    public function thumbnail(Request $request, Video $video): RedirectResponse|StreamedResponse
    {
        /** @var Student $student */
        $student = $request->user();

        $this->authorization->assertStudentCanView($video, $student);

        if (! $video->thumbnail_path || ! $this->storage->exists($video->thumbnail_path)) {
            abort(404, 'Thumbnail not found');
        }

        try {
            $signedUrl = $this->storage->temporaryUrl(
                $video->thumbnail_path,
                \Illuminate\Support\Carbon::now()->addSeconds(45),
                ['ResponseContentType' => 'image/jpeg']
            );

            return redirect()->away($signedUrl);
        } catch (\Throwable) {
            return $this->streamPrivateFile($video->thumbnail_path, 'image/jpeg', false);
        }
    }

    public function attachmentViewUrl(Request $request, Video $video, string $attachmentId): JsonResponse
    {
        /** @var Student $student */
        $student = $request->user();

        $this->authorization->assertStudentCanView($video, $student);

        $attachment = VideoAttachment::query()
            ->where('video_id', $video->id)
            ->findOrFail($attachmentId);

        if (! $this->storage->exists($attachment->file_path)) {
            abort(404, 'Attachment not found');
        }

        try {
            $signedUrl = $this->storage->temporaryUrl(
                $attachment->file_path,
                \Illuminate\Support\Carbon::now()->addMinutes(30),
                [
                    'ResponseContentType'        => $attachment->mime_type,
                    'ResponseContentDisposition' => 'inline; filename="' . addslashes($attachment->file_name) . '"',
                ]
            );
        } catch (\Throwable) {
            abort(500, 'Could not generate view URL');
        }

        return $this->successResponse([
            'url'       => $signedUrl,
            'mime_type' => $attachment->mime_type,
            'file_name' => $attachment->file_name,
            'expires_in' => 1800,
        ]);
    }

    public function downloadAttachment(Request $request, Video $video, string $attachmentId): RedirectResponse|StreamedResponse
    {
        /** @var Student $student */
        $student = $request->user();

        $this->authorization->assertStudentCanView($video, $student);

        $attachment = VideoAttachment::query()
            ->where('video_id', $video->id)
            ->findOrFail($attachmentId);

        if (! $this->storage->exists($attachment->file_path)) {
            abort(404, 'Attachment not found');
        }

        try {
            $signedUrl = $this->storage->temporaryUrl(
                $attachment->file_path,
                \Illuminate\Support\Carbon::now()->addSeconds(90),
                [
                    'ResponseContentType' => $attachment->mime_type,
                    'ResponseContentDisposition' => 'attachment; filename="' . addslashes($attachment->file_name) . '"',
                ]
            );

            return redirect()->away($signedUrl);
        } catch (\Throwable) {
            return $this->streamPrivateFile($attachment->file_path, $attachment->mime_type, true, $attachment->file_name);
        }
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
