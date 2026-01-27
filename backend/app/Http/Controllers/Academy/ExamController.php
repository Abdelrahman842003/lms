<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Http\Resources\Teacher\ExamResource;
use App\Models\Exam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search');
        $teacherId = $request->input('teacher_id');
        $status = $request->input('status');

        $query = Exam::query()
            ->with(['teacher', 'grade', 'group'])
            ->whereHas('teacher.academies', function ($q) {
                $q->where('academies.id', auth()->user()->id);
            });

        if ($search) {
            $query->where('title', 'like', "%{$search}%");
        }

        if ($teacherId) {
            $query->where('teacher_id', $teacherId);
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'upcoming') {
            $query->where('is_active', false)
                  ->whereNull('ended_at')
                  ->where('date', '>', now());
        } elseif ($status === 'ended') {
            $query->whereNotNull('ended_at');
        }

        $exams = $query->latest()->paginate($perPage);

        return $this->successResponse(
            ExamResource::collection($exams)->response()->getData(true)
        );
    }

    public function show(Exam $exam): JsonResponse
    {
        // Ensure exam belongs to a teacher in this academy
        $hasAccess = $exam->teacher->academies()
            ->where('academies.id', auth()->user()->id)
            ->exists();

        if (!$hasAccess) {
            return $this->errorResponse('Unauthorized', 403);
        }

        return $this->successResponse([
            'exam' => $exam->load(['questions', 'grade', 'group', 'teacher'])
        ]);
    }

    public function destroy(Exam $exam): JsonResponse
    {
        $hasAccess = $exam->teacher->academies()
            ->where('academies.id', auth()->user()->id)
            ->exists();

        if (!$hasAccess) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $exam->delete();
        return $this->successResponse(null, 'تم حذف الامتحان بنجاح');
    }

    public function toggleStatus(Exam $exam): JsonResponse
    {
        $hasAccess = $exam->teacher->academies()
            ->where('academies.id', auth()->user()->id)
            ->exists();

        if (!$hasAccess) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $exam->update(['is_active' => !$exam->is_active]);
        
        return $this->successResponse(
            new ExamResource($exam),
            $exam->is_active ? 'تم تفعيل الامتحان' : 'تم إلغاء تفعيل الامتحان'
        );
    }

    public function endExam(Exam $exam): JsonResponse
    {
        $hasAccess = $exam->teacher->academies()
            ->where('academies.id', auth()->user()->id)
            ->exists();

        if (!$hasAccess) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $exam->update([
            'is_active' => false,
            'ended_at' => now()
        ]);

        return $this->successResponse(
            new ExamResource($exam),
            'تم إنهاء الامتحان بنجاح'
        );
    }
}
