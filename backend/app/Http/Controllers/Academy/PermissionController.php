<?php

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\JsonResponse;

class PermissionController extends Controller
{
    public function index(): JsonResponse
    {
        $permissions = Permission::where('guard_name', 'secretary')->get();
        return $this->successResponse($permissions);
    }
}
