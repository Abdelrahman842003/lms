<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index(): JsonResponse
    {
        $permissions = Permission::all();
        return $this->successResponse($permissions);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|unique:permissions,name',
        ]);

        $permission = Permission::create(['name' => $request->name, 'guard_name' => 'admin']);

        return $this->successResponse($permission, 'تم إنشاء الصلاحية بنجاح', 201);
    }

    public function show(Permission $permission): JsonResponse
    {
        return $this->successResponse($permission);
    }

    public function update(Request $request, Permission $permission): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|unique:permissions,name,' . $permission->id,
        ]);

        $permission->update(['name' => $request->name]);

        return $this->successResponse($permission, 'تم تحديث الصلاحية بنجاح');
    }

    public function destroy(Permission $permission): JsonResponse
    {
        $permission->delete();
        return $this->successResponse(null, 'تم حذف الصلاحية بنجاح');
    }
}
