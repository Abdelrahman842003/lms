<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Group\StoreGroupRequest;
use App\Http\Requests\Teacher\Group\UpdateGroupRequest;
use App\Http\Resources\Teacher\GroupResource;
use App\Models\Group;
use App\Services\Teacher\GroupService;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    use \App\Traits\ResolvesTeacher;
    protected $groupService;

    public function __construct(GroupService $groupService)
    {
        $this->groupService = $groupService;
    }

    public function index(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = $request->input('per_page', 10);
        $filters = $request->only(['search', 'grade_id']);
        $academyId = $request->header('X-Academy-Id');
        
        $groups = $this->groupService->getGroups($teacher, $perPage, $filters, $academyId);
        
        return $this->successResponse(
            GroupResource::collection($groups)->response()->getData(true)
        );
    }

    public function show(Request $request, Group $group)
    {
        if ($group->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $group->load(['grade', 'enrollments.student']);
        
        // Get students from enrollments where student exists
        $students = $group->enrollments
            ->filter(function ($enrollment) {
                return $enrollment->student !== null;
            })
            ->map(function ($enrollment) {
                return $enrollment->student;
            });

        return $this->successResponse([
            'group' => new GroupResource($group),
            'students' => \App\Http\Resources\Teacher\StudentResource::collection($students)
        ]);
    }

    public function store(StoreGroupRequest $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        $academyId = $request->header('X-Academy-Id');
        
        $data = $request->validated();
        
        // Set academy_id based on context
        if ($academyId && $academyId !== 'independent') {
            // Check if teacher belongs to this academy
            $teacherBelongsToAcademy = \Illuminate\Support\Facades\DB::table('academy_teacher')
                ->where('teacher_id', $teacher->id)
                ->where('academy_id', $academyId)
                ->where('is_active', true)
                ->exists();
            
            if ($teacherBelongsToAcademy) {
                $data['academy_id'] = $academyId;
            } else {
                $data['academy_id'] = null;
            }
        } else {
            $data['academy_id'] = null;
        }
        
        $group = $this->groupService->createGroup($teacher, $data);

        return $this->successResponse([
            'group' => new GroupResource($group),
            'message' => 'تم إضافة المجموعة بنجاح'
        ], 201);
    }

    public function update(UpdateGroupRequest $request, Group $group)
    {
        if ($group->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $group = $this->groupService->updateGroup($group, $request->validated());

        return $this->successResponse([
            'group' => new GroupResource($group),
            'message' => 'تم تحديث المجموعة بنجاح'
        ]);
    }

    public function destroy(Request $request, Group $group)
    {
        if ($group->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $this->groupService->deleteGroup($group);

        return $this->successResponse([
            'message' => 'تم حذف المجموعة بنجاح'
        ]);
    }
}
