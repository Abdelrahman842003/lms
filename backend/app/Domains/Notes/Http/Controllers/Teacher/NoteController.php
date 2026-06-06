<?php

declare(strict_types=1);

namespace App\Domains\Notes\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Traits\ResolvesTeacher;
use App\Domains\Notes\Models\Note;
use App\Domains\Notes\Resources\NoteResource;
use App\Domains\Notes\Services\NoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    use ResolvesTeacher;

    public function __construct(
        private readonly NoteService $noteService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $academyId = $request->header('X-Academy-Id') ?? $request->input('academy_id');
        
        $query = Note::where('teacher_profile_id', $teacher->id)
            ->with(['grade', 'groups', 'attachments']);

        if ($academyId === 'independent') {
            $query->whereNull('academy_id');
        } elseif ($academyId) {
            $query->where('academy_id', $academyId);
        }

        $notes = $query->latest()
            ->paginate((int) $request->input('per_page', 15));

        return $this->successResponse(NoteResource::collection($notes)->response()->getData(true));
    }

    public function initiate(Request $request): JsonResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'grade_id' => ['required', 'uuid', 'exists:grades,id'],
            'files' => ['required', 'array', 'min:1', 'max:2'],
            'files.*.name' => ['required', 'string'],
            'files.*.mime' => ['nullable', 'string'],
            'files.*.size' => ['nullable', 'integer'],
        ]);

        $teacher = $this->getTeacherFromRequest($request);
        $academyId = $request->header('X-Academy-Id') ?? $request->input('academy_id');
        
        $resolvedAcademyId = null;
        if ($academyId && $academyId !== 'independent') {
            // Check if teacher belongs to this academy using the pivot table
            $teacherBelongsToAcademy = \Illuminate\Support\Facades\DB::table('academy_teacher')
                ->where('teacher_id', $teacher->teacher_id)
                ->where('academy_id', $academyId)
                ->where('is_active', true)
                ->exists();
            
            if ($teacherBelongsToAcademy) {
                $resolvedAcademyId = $academyId;
            } else {
                return $this->errorResponse('المدرس لا ينتمي لهذه الأكاديمية', 403);
            }

            // Ensure grade belongs to this academy
            $gradeBelongsToAcademy = \Illuminate\Support\Facades\DB::table('grades')
                ->where('id', $request->input('grade_id'))
                ->where('academy_id', $resolvedAcademyId)
                ->exists();
            if (!$gradeBelongsToAcademy) {
                return $this->errorResponse('الصف الدراسي المختار لا ينتمي للأكاديمية الحالية', 400);
            }
        } else {
            // Independent context: ensure grade has no academy_id
            $gradeIsIndependent = \Illuminate\Support\Facades\DB::table('grades')
                ->where('id', $request->input('grade_id'))
                ->whereNull('academy_id')
                ->exists();
            if (!$gradeIsIndependent) {
                return $this->errorResponse('الصف الدراسي المختار ليس صفاً مستقلاً', 400);
            }
        }

        $payload = $this->noteService->initiateNote([
            'academy_id' => $resolvedAcademyId,
            'teacher_profile_id' => $teacher->id,
            'grade_id' => $request->input('grade_id'),
            'title' => $request->input('title'),
            'description' => $request->input('description'),
        ], $request->input('files'));

        return $this->successResponse($payload, 'تم تهيئة المذكرة. استخدم الروابط المرفقة لرفع الملفات.', 201);
    }

    public function complete(Request $request, Note $note): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);

        if ((string) $note->teacher_profile_id !== (string) $teacher->id) {
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
        $teacher = $this->getTeacherFromRequest($request);
        
        if ((string) $note->teacher_profile_id !== (string) $teacher->id) {
            abort(403);
        }

        $note->load(['grade', 'groups', 'attachments']);

        return $this->successResponse([
            'note' => new NoteResource($note),
        ]);
    }

    public function destroy(Request $request, Note $note): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);

        if ((string) $note->teacher_profile_id !== (string) $teacher->id) {
            abort(403);
        }

        $this->noteService->deleteNote($note);

        return $this->successResponse([], 'تم حذف المذكرة بنجاح.');
    }
}
