<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Academy;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Resources\Academy\PermissionResource;
use App\Domains\Application\Services\Academy\PermissionService;
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
