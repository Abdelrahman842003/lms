<?php

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Http\Resources\Teacher\GroupResource;
use App\Models\Group;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GroupController extends Controller
{
    public function index(Request $request)
    {
        $academy = Auth::user();
        $perPage = $request->input('per_page', 10);
        
        $groups = Group::whereHas('teacher', function ($query) use ($academy) {
            $query->whereHas('academies', function ($q) use ($academy) {
                      $q->where('academy_id', $academy->id);
                  });
        })
        ->when($request->search, function ($query, $search) {
            $query->where('name', 'like', "%{$search}%");
        })
        ->when($request->grade_id, function ($query, $gradeId) {
            $query->where('grade_id', $gradeId);
        })
        ->when($request->teacher_id, function ($query, $teacherId) {
            $query->where('teacher_id', $teacherId);
        })
        ->with(['teacher', 'grade'])
        ->latest()
        ->paginate($perPage);
        
        return $this->successResponse(
            GroupResource::collection($groups)->response()->getData(true)
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'teacher_id' => 'required|exists:teachers,id',
            'grade_id' => 'nullable|exists:grades,id',
            'time' => 'nullable|string',
            'days' => 'nullable|string',
            'type' => 'required|in:general,private',
            'price' => 'nullable|numeric|min:0',
        ]);

        $academy = Auth::user();
        
        // Verify teacher belongs to academy and is active
        $teacher = Teacher::where('id', $request->teacher_id)
            ->where('teachers.status', 'active')
            ->whereHas('academies', function ($q) use ($academy) {
                $q->where('academy_id', $academy->id)
                  ->where('academy_teacher.is_active', true);
            })->firstOrFail();

        // If grade_id is provided, verify it belongs to the teacher
        if ($request->grade_id) {
            $grade = $teacher->grades()->where('id', $request->grade_id)->first();
            if (!$grade) {
                return $this->errorResponse('الصف الدراسي غير تابع للمدرس المختار', 422);
            }
        }

        $group = $teacher->groups()->create($request->all());

        return $this->successResponse([
            'group' => new GroupResource($group),
            'message' => 'تم إضافة المجموعة بنجاح'
        ], 201);
    }

    public function update(Request $request, Group $group)
    {
        $academy = Auth::user();

        // Verify group belongs to a teacher in this academy
        if (!$group->teacher->academies()->where('academy_id', $academy->id)->exists()) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'grade_id' => 'nullable|exists:grades,id',
            'time' => 'nullable|string',
            'days' => 'nullable|string',
            'type' => 'required|in:general,private',
            'price' => 'nullable|numeric|min:0',
        ]);

        // If grade_id is changing, verify it belongs to the SAME teacher
        if ($request->grade_id && $request->grade_id !== $group->grade_id) {
            $grade = $group->teacher->grades()->where('id', $request->grade_id)->first();
            if (!$grade) {
                return $this->errorResponse('الصف الدراسي غير تابع لمدرس المجموعة', 422);
            }
        }

        $group->update($request->all());

        return $this->successResponse([
            'group' => new GroupResource($group),
            'message' => 'تم تحديث المجموعة بنجاح'
        ]);
    }

    public function destroy(Group $group)
    {
        $academy = Auth::user();

        // Verify group belongs to a teacher in this academy
        if (!$group->teacher->academies()->where('academy_id', $academy->id)->exists()) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $group->delete();

        return $this->successResponse([
            'message' => 'تم حذف المجموعة بنجاح'
        ]);
    }
}
