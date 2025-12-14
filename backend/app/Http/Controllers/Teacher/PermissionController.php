<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\Permission\StorePermissionRequest;
use App\Http\Requests\Teacher\Permission\UpdatePermissionRequest;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    public function index()
    {
        $permissions = Permission::whereIn('guard_name', ['student', 'secretary'])->get();
        return $this->successResponse(['data' => $permissions]);
    }

    public function store(StorePermissionRequest $request)
    {
        if (Permission::where('name', $request->name)->where('guard_name', $request->guard_name)->exists()) {
             return $this->errorResponse('The permission name has already been taken for this guard.', 422);
        }

        $permission = Permission::create(['name' => $request->name, 'guard_name' => $request->guard_name]);

        return $this->successResponse(['data' => $permission, 'message' => 'Permission created successfully'], 201);
    }

    public function show(Permission $permission)
    {
        return $this->successResponse(['data' => $permission]);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission)
    {
        if ($permission->name !== $request->name) {
            if (Permission::where('name', $request->name)->where('guard_name', $permission->guard_name)->exists()) {
                 return $this->errorResponse('The permission name has already been taken for this guard.', 422);
            }
        }

        $permission->update(['name' => $request->name]);

        return $this->successResponse(['data' => $permission, 'message' => 'Permission updated successfully']);
    }

    public function destroy(Permission $permission)
    {
        $permission->delete();
        return $this->successResponse(['message' => 'Permission deleted successfully']);
    }
}
