<?php

declare(strict_types=1);

namespace App\Http\Controllers\Teacher;

use App\DTOs\Teacher\GroupData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Group\StoreGroupRequest;
use App\Http\Requests\Teacher\Group\UpdateGroupRequest;
use App\Http\Resources\Teacher\GroupResource;
use App\Http\Resources\Teacher\StudentResource;
use App\Models\Group;
use App\Services\Teacher\GroupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroupController extends Controller
{
    use \App\Traits\ResolvesTeacher;

    public function __construct(
        private GroupService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'grade_id']);
        $academyId = $request->header('X-Academy-Id');
        
        $groups = $this->service->getGroups($teacher, $perPage, $filters, $academyId);
        
        return $this->successResponse(
            GroupResource::collection($groups)->response()->getData(true)
        );
    }

    public function show(Request $request, Group $group): JsonResponse
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
            'students' => StudentResource::collection($students)
        ]);
    }

    public function store(StoreGroupRequest $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $academyId = $request->header('X-Academy-Id');
        
        // Set academy_id based on context
        if ($academyId && $academyId !== 'independent') {
            // Check if teacher belongs to this academy
            $teacherBelongsToAcademy = DB::table('academy_teacher')
                ->where('teacher_id', $teacher->id)
                ->where('academy_id', $academyId)
                ->where('is_active', true)
                ->exists();
            
            if ($teacherBelongsToAcademy) {
                $request->merge(['academy_id' => $academyId]);
            } else {
                $request->merge(['academy_id' => null]);
            }
        } else {
            $request->merge(['academy_id' => null]);
        }
        
        $groupData = GroupData::fromRequest($request);
        $group = $this->service->createGroup($teacher, $groupData);

        return $this->successResponse([
            'group' => new GroupResource($group),
            'message' => 'تم إضافة المجموعة بنجاح'
        ], 201);
    }

    public function update(UpdateGroupRequest $request, Group $group): JsonResponse
    {
        if ($group->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $groupData = GroupData::fromRequest($request);
        $group = $this->service->updateGroup($group, $groupData);

        return $this->successResponse([
            'group' => new GroupResource($group),
            'message' => 'تم تحديث المجموعة بنجاح'
        ]);
    }

    public function destroy(Request $request, Group $group): JsonResponse
    {
        if ($group->teacher_id !== $this->getTeacherFromRequest($request)->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $this->service->deleteGroup($group);

        return $this->successResponse([
            'message' => 'تم حذف المجموعة بنجاح'
        ]);
    }
}
