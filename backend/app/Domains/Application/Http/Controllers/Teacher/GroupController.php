<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Enrollments\DTOs\TeacherGroupData;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Group\StoreGroupRequest;
use App\Domains\Application\Http\Requests\Teacher\Group\UpdateGroupRequest;
use App\Domains\Application\Http\Resources\Teacher\GroupResource;
use App\Domains\Application\Http\Resources\Teacher\StudentResource;
use App\Domains\Application\Services\Teacher\GroupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class GroupController extends Controller
{
    use \App\Domains\Application\Traits\ResolvesTeacher;

    public function __construct(
        private GroupService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $teacher = $this->getProfileFromRequest($request);
        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'grade_id']);
        $academyId = $request->header('X-Academy-Id') ?? $request->input('academy_id');
        
        $groups = $this->service->getGroups($teacher, $perPage, $filters, $academyId);
        
        return $this->successResponse(
            GroupResource::collection($groups)->response()->getData(true)
        );
    }

    public function show(Request $request, Group $group): JsonResponse
    {
        Gate::authorize('view', $group);

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
        $teacher = $this->getProfileFromRequest($request);
        $academyId = $request->header('X-Academy-Id');
        
        // Set academy_id based on context
        if ($academyId && $academyId !== 'independent') {
            // Check if teacher belongs to this academy
            $teacherBelongsToAcademy = DB::table('academy_teacher')
                ->where('teacher_id', $teacher->teacher_id)
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
        
        $groupData = TeacherGroupData::fromRequest($request);
        $group = $this->service->createGroup($teacher, $groupData);

        return $this->successResponse([
            'group' => new GroupResource($group)
        ], 'تم إضافة المجموعة بنجاح', 201);
    }

    public function update(UpdateGroupRequest $request, Group $group): JsonResponse
    {
        Gate::authorize('update', $group);

        $groupData = TeacherGroupData::fromRequest($request);
        $group = $this->service->updateGroup($group, $groupData);

        return $this->successResponse([
            'group' => new GroupResource($group)
        ], 'تم تحديث المجموعة بنجاح');
    }

    public function destroy(Request $request, Group $group): JsonResponse
    {
        Gate::authorize('delete', $group);

        $this->service->deleteGroup($group);

        return $this->successResponse([
            'message' => 'تم حذف المجموعة بنجاح'
        ], 'تم حذف المجموعة بنجاح');
    }
}
