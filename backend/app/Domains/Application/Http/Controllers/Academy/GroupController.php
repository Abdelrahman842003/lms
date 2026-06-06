<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Enrollments\DTOs\GroupData;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Academy\Group\StoreGroupRequest;
use App\Domains\Application\Http\Requests\Academy\Group\UpdateGroupRequest;
use App\Domains\Application\Http\Resources\Teacher\GroupResource;
use App\Domains\Application\Services\Academy\GroupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class GroupController extends Controller
{
    public function __construct(
        private GroupService $service
    ) {}

    protected function getAcademy(Request $request): ?\App\Domains\Auth\Models\Academy
    {
        $user = Auth::user();
        
        if ($user instanceof \App\Domains\Auth\Models\Academy) {
            return $user;
        }
        
        // Secretary case - get academy via relationship
        if ($user instanceof \App\Domains\Auth\Models\Secretary) {
            return $user->academies()->first();
        }
        
        return null;
    }

    public function index(Request $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', null, 403);
        }
        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'grade_id', 'grade_name']);
        if ($request->has('teacher_profile_id')) {
            $filters['teacher_profile_id'] = $request->input('teacher_profile_id');
        } elseif ($request->has('teacher_id')) {
            $teacherId = $request->input('teacher_id');
            $profile = \App\Domains\Auth\Models\TeacherProfile::where('academy_id', $academy->id)
                ->where(function ($q) use ($teacherId) {
                    $q->where('id', $teacherId)
                      ->orWhere('uuid', $teacherId)
                      ->orWhere('teacher_id', $teacherId);
                })
                ->first();
            $filters['teacher_profile_id'] = $profile ? $profile->id : $teacherId;
        }
        
        $groups = $this->service->getGroups($academy, $filters, $perPage);

        Log::info('Academy Groups Debug:', [
            'academy_id' => $academy->id,
            'academy_name' => $academy->name,
            'groups_count' => $groups->count(),
            'filters' => $filters
        ]);
        
        return $this->successResponse(
            GroupResource::collection($groups)->response()->getData(true)
        );
    }

    public function store(StoreGroupRequest $request): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', null, 403);
        }
        $data = GroupData::fromRequest($request);
        
        $group = $this->service->createGroup($academy, $data);
        
        return $this->successResponse([
            'group' => new GroupResource($group),
            'message' => 'تم إضافة المجموعة بنجاح'
        ], 'تم إضافة المجموعة بنجاح', 201);
    }

    public function update(UpdateGroupRequest $request, Group $group): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        // Verify group belongs to a teacher in this academy
        if (!$this->isOwnedByAcademy($academy, $group)) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        $data = GroupData::fromRequest($request);

        $group = $this->service->updateGroup($academy, $group, $data);
        
        return $this->successResponse([
            'group' => new GroupResource($group),
            'message' => 'تم تحديث المجموعة بنجاح'
        ]);
    }

    public function destroy(Request $request, Group $group): JsonResponse
    {
        $academy = $this->getAcademy($request);
        if (!$academy) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        // Verify group belongs to a teacher in this academy
        if (!$this->isOwnedByAcademy($academy, $group)) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        $this->service->deleteGroup($group);

        return $this->successResponse([
            'message' => 'تم حذف المجموعة بنجاح'
        ]);
    }    private function isOwnedByAcademy($academy, Group $group): bool
    {
        return $group->academy_id === $academy->id || 
               ($group->grade && $group->grade->academy_id === $academy->id);
    }
}
