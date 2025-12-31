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
        $groups = $this->groupService->getGroups($teacher, $perPage, $filters);
        
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
        $group = $this->groupService->createGroup($teacher, $request->validated());

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
