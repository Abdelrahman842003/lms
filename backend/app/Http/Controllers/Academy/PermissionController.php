<?php

declare(strict_types=1);

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Http\Resources\Academy\PermissionResource;
use App\Services\Academy\PermissionService;
use Illuminate\Http\JsonResponse;

class PermissionController extends Controller
{
    public function __construct(
        private PermissionService $service
    ) {}

    public function index(): JsonResponse
    {
        $permissions = $this->service->getSecretaryPermissions();
        
        return $this->successResponse(
            PermissionResource::collection($permissions)
        );
    }
}
