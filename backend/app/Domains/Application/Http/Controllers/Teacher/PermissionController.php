<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\Permission\StorePermissionRequest;
use App\Domains\Application\Http\Requests\Teacher\Permission\UpdatePermissionRequest;
use App\Domains\Application\Services\Teacher\PermissionService;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function __construct(
        private PermissionService $service
    ) {}

    public function index(): JsonResponse
    {
        $permissions = $this->service->getPermissions();
        return $this->successResponse($permissions);
    }

    public function store(StorePermissionRequest $request): JsonResponse
    {
        try {
            $permission = $this->service->createPermission($request->validated());
            return $this->successResponse(['data' => $permission, 'message' => 'تم إنشاء الصلاحية بنجاح'], 'تم إنشاء الصلاحية بنجاح', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function show(Permission $permission): JsonResponse
    {
        return $this->successResponse(['data' => $permission]);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission): JsonResponse
    {
        try {
            $permission = $this->service->updatePermission($permission, $request->validated());
            return $this->successResponse(['data' => $permission, 'message' => 'تم تحديث الصلاحية بنجاح']);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function destroy(Permission $permission): JsonResponse
    {
        $this->service->deletePermission($permission);
        return $this->successResponse(['message' => 'تم حذف الصلاحية بنجاح']);
    }
}
