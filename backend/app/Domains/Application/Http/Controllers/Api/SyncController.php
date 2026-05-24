<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Api;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Services\SyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    protected SyncService $syncService;

    public function __construct(SyncService $syncService)
    {
        $this->syncService = $syncService;
    }

    /**
     * Pull delta synchronization data since last timestamps per entity
     */
    public function pull(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return $this->unauthorized();
        }

        $sinceJson = $request->query('since', '{}');
        $sinceData = json_decode($sinceJson, true) ?? [];

        try {
            $data = $this->syncService->pullEntities($user, $sinceData);
            return $this->successResponse($data, 'تم سحب البيانات المحدثة بنجاح');
        } catch (\Exception $e) {
            return $this->errorResponse('فشل سحب المزامنة: ' . $e->getMessage(), null, 500);
        }
    }
}
