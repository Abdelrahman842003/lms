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

    public function index(Request $request): JsonResponse
    {
        $academy = Auth::user();
        $perPage = (int) $request->input('per_page', 10);
        $filters = $request->only(['search', 'grade_id', 'grade_name', 'teacher_id']);
        
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
        $academy = Auth::user();
        $data = GroupData::fromRequest($request);
        
        try {
            $group = $this->service->createGroup($academy, $data);
            
            return $this->successResponse([
                'group' => new GroupResource($group),
                'message' => 'تم إضافة المجموعة بنجاح'
            ], 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function update(UpdateGroupRequest $request, Group $group): JsonResponse
    {
        $academy = Auth::user();

        // Verify group belongs to a teacher in this academy
        if (!$this->isOwnedByAcademy($academy, $group)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $data = GroupData::fromRequest($request);

        try {
            $group = $this->service->updateGroup($academy, $group, $data);

            return $this->successResponse([
                'group' => new GroupResource($group),
                'message' => 'تم تحديث المجموعة بنجاح'
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function destroy(Group $group): JsonResponse
    {
        $academy = Auth::user();

        // Verify group belongs to a teacher in this academy
        if (!$this->isOwnedByAcademy($academy, $group)) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $this->service->deleteGroup($group);

        return $this->successResponse([
            'message' => 'تم حذف المجموعة بنجاح'
        ]);
    }

    private function isOwnedByAcademy($academy, Group $group): bool
    {
        return $group->academy_id === $academy->id || 
               ($group->grade && $group->grade->academy_id === $academy->id);
    }
}
