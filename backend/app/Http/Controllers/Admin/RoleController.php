<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\RoleService;
use App\Http\Requests\Admin\Role\StoreRoleRequest;
use App\Http\Requests\Admin\Role\UpdateRoleRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function __construct(
        private RoleService $roleService
    ) {}
    public function index(): JsonResponse
    {
        $roles = $this->roleService->getAllRoles();
        return $this->successResponse($roles);
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = $this->roleService->createRole($request->validated());

        return $this->successResponse($role, 'تم إنشاء الدور بنجاح', 201);
    }

    public function show(Role $role): JsonResponse
    {
        return $this->successResponse($role->load('permissions'));
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        $role = $this->roleService->updateRole($role, $request->validated());

        return $this->successResponse($role, 'تم تحديث الدور بنجاح');
    }

    public function destroy(Role $role): JsonResponse
    {
        $this->roleService->deleteRole($role);
        return $this->successResponse(null, 'تم حذف الدور بنجاح');
    }
}
