<?php

declare(strict_types=1);

namespace App\Domains\Notes\Http\Controllers\Academy;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Notes\Models\Note;
use App\Domains\Notes\Resources\NoteResource;
use App\Domains\Notes\Services\NoteService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function __construct(
        private readonly NoteService $noteService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $academyId = $this->resolveAcademyId($request);
        
        $notes = Note::where('academy_id', $academyId)
            ->with(['grade', 'groups', 'attachments', 'teacher'])
            ->latest()
            ->paginate((int) $request->input('per_page', 15));

        return $this->successResponse(NoteResource::collection($notes)->response()->getData(true));
    }

    public function initiate(Request $request): JsonResponse
    {
        $request->validate([
            'teacher_id' => ['required', 'uuid', 'exists:teachers,id'],
            'grade_id' => ['required', 'uuid', 'exists:grades,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'files' => ['required', 'array', 'min:1', 'max:2'],
            'files.*.name' => ['required', 'string'],
            'files.*.mime' => ['nullable', 'string'],
            'files.*.size' => ['nullable', 'integer'],
        ]);

        $academyId = $this->resolveAcademyId($request);

        $payload = $this->noteService->initiateNote([
            'academy_id' => $academyId,
            'teacher_id' => $request->input('teacher_id'),
            'grade_id' => $request->input('grade_id'),
            'title' => $request->input('title'),
            'description' => $request->input('description'),
        ], $request->input('files'));

        return $this->successResponse($payload, 'تم تهيئة المذكرة بنجاح.', 201);
    }

    public function complete(Request $request, Note $note): JsonResponse
    {
        $academyId = $this->resolveAcademyId($request);

        if ((string) $note->academy_id !== (string) $academyId) {
            abort(403);
        }

        $request->validate([
            'group_ids' => ['required', 'array', 'min:1'],
            'group_ids.*' => ['required', 'uuid', 'exists:groups,id'],
            'attachments' => ['required', 'array', 'min:1', 'max:2'],
            'attachments.*.name' => ['required', 'string'],
            'attachments.*.file_path' => ['required', 'string'],
            'attachments.*.mime_type' => ['required', 'string'],
            'attachments.*.file_size' => ['required', 'integer'],
        ]);

        $note = $this->noteService->completeNote(
            $note,
            $request->input('attachments'),
            $request->input('group_ids')
        );

        return $this->successResponse([
            'note' => new NoteResource($note),
        ], 'تم إكمال إنشاء المذكرة بنجاح.');
    }

    public function show(Request $request, Note $note): JsonResponse
    {
        $academyId = $this->resolveAcademyId($request);
        
        if ((string) $note->academy_id !== (string) $academyId) {
            abort(403);
        }

        $note->load(['grade', 'groups', 'attachments', 'teacher']);

        return $this->successResponse([
            'note' => new NoteResource($note),
        ]);
    }

    public function destroy(Request $request, Note $note): JsonResponse
    {
        $academyId = $this->resolveAcademyId($request);

        if ((string) $note->academy_id !== (string) $academyId) {
            abort(403);
        }

        $this->noteService->deleteNote($note);

        return $this->successResponse([], 'تم حذف المذكرة بنجاح.');
    }

    private function resolveAcademyId(Request $request): ?string
    {
        $user = $request->user();
        if ($user instanceof Academy) {
            return (string) $user->id;
        }
        if ($user instanceof Secretary) {
            return $request->header('X-Academy-Id') ?: (string) $request->input('academy_id');
        }
        throw new AuthorizationException('الحساب الحالي غير مصرح له.');
    }
}
