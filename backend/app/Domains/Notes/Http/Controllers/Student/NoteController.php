<?php

declare(strict_types=1);

namespace App\Domains\Notes\Http\Controllers\Student;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Notes\Models\Note;
use App\Domains\Notes\Models\NoteAttachment;
use App\Domains\Notes\Resources\NoteResource;
use App\Domains\Notes\Services\NoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NoteController extends Controller
{
    public function __construct(
        private readonly NoteService $noteService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $student = $request->user();
        $groupIds = $student->groups()->pluck('groups.id');

        $notes = Note::query()
            ->where('is_active', true)
            ->whereHas('groups', function ($query) use ($groupIds) {
                $query->whereIn('groups.id', $groupIds);
            })
            ->with(['teacher', 'attachments'])
            ->latest()
            ->paginate((int) $request->input('per_page', 15));

        return $this->successResponse(NoteResource::collection($notes)->response()->getData(true));
    }

    public function show(Request $request, Note $note): JsonResponse
    {
        $student = $request->user();
        $groupIds = $student->groups()->pluck('groups.id');

        // Verify student has access to this note
        $hasAccess = DB::table('note_group_targets')
            ->where('note_id', $note->id)
            ->whereIn('group_id', $groupIds)
            ->exists();

        if (! $hasAccess) {
            abort(403, 'ليس لديك صلاحية للوصول لهذه المذكرة.');
        }

        $note->load(['teacher', 'attachments']);

        return $this->successResponse([
            'note' => new NoteResource($note),
        ]);
    }

    public function getAttachmentUrl(Request $request, Note $note, NoteAttachment $attachment): JsonResponse
    {
        $student = $request->user();
        $groupIds = $student->groups()->pluck('groups.id');

        // Verify student has access to this note
        $hasAccess = DB::table('note_group_targets')
            ->where('note_id', $note->id)
            ->whereIn('group_id', $groupIds)
            ->exists();

        if (! $hasAccess || (string) $attachment->note_id !== (string) $note->id) {
            abort(403, 'ليس لديك صلاحية للوصول لهذا الملف.');
        }

        // Log the view only if the user is a Student
        if ($student instanceof \App\Domains\Auth\Models\Student) {
            DB::table('note_view_logs')->insert([
                'note_id' => $note->id,
                'student_id' => $student->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
        }

        $url = $this->noteService->getPresignedDownloadUrl($attachment);

        return $this->successResponse([
            'url' => $url,
            'mime_type' => $attachment->mime_type,
        ]);
    }
}
