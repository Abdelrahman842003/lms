<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\SyncError\BulkResolveSyncErrorRequest;
use App\Domains\Application\Http\Requests\Teacher\SyncError\ResolveSyncErrorRequest;
use App\Domains\Application\Services\Teacher\SyncErrorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SyncErrorController extends Controller
{
    use \App\Domains\Application\Traits\ResolvesTeacher;

    public function __construct(
        private SyncErrorService $service
    ) {}

    /**
     * List all sync errors for the teacher
     */
    public function index(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = (int) $request->input('per_page', 20);
        
        $filters = [
            'resolved' => $request->has('resolved') ? $request->boolean('resolved') : null,
            'type' => $request->input('type'),
        ];

        $errors = $this->service->listErrors($teacher, $filters, $perPage);

        return $this->successResponse([
            'errors' => $errors,
        ]);
    }

    /**
     * Show sync error details
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $error = $this->service->getError($teacher, $id);

        return $this->successResponse([
            'error' => $error,
        ]);
    }

    /**
     * Resolve a sync error
     */
    public function resolve(ResolveSyncErrorRequest $request, string $id): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $validated = $request->validated();

        try {
            $error = $this->service->resolveError($teacher, $id, $validated['notes'] ?? null);

            return $this->successResponse([
                'message' => 'تم حل المشكلة بنجاح',
                'error' => $error,
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 404);
        }
    }

    /**
     * Get unresolved errors count
     */
    public function unresolvedCount(Request $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $count = $this->service->getUnresolvedCount($teacher);

        return $this->successResponse([
            'count' => $count,
        ]);
    }

    /**
     * Bulk resolve errors
     */
    public function bulkResolve(BulkResolveSyncErrorRequest $request): JsonResponse
    {
        $teacher = $this->getTeacherFromRequest($request);
        $validated = $request->validated();

        $count = $this->service->bulkResolveErrors($teacher, $validated['ids'], $validated['notes'] ?? null);

        return $this->successResponse([
            'message' => "تم حل {$count} مشكلة بنجاح",
            'resolved_count' => $count,
        ]);
    }
}
