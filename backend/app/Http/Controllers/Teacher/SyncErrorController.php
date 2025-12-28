<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\SyncError;
use Illuminate\Http\Request;

class SyncErrorController extends Controller
{
    use \App\Traits\ResolvesTeacher;
    /**
     * List all sync errors for the teacher
     */
    public function index(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);
        $perPage = $request->input('per_page', 20);

        $query = SyncError::forUser($teacher->id);

        // Filter by resolved status
        if ($request->has('resolved')) {
            if ($request->boolean('resolved')) {
                $query->resolved();
            } else {
                $query->unresolved();
            }
        }

        // Filter by operation type
        if ($request->filled('type')) {
            $query->ofType($request->type);
        }

        $errors = $query->latest()->paginate($perPage);

        return $this->successResponse([
            'errors' => $errors,
        ]);
    }

    /**
     * Show sync error details
     */
    public function show(Request $request, string $id)
    {
        $teacher = $this->getTeacherFromRequest($request);

        $error = SyncError::forUser($teacher->id)->findOrFail($id);

        return $this->successResponse([
            'error' => $error,
        ]);
    }

    /**
     * Resolve a sync error
     */
    public function resolve(Request $request, string $id)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $teacher = $this->getTeacherFromRequest($request);

        $error = SyncError::forUser($teacher->id)
            ->unresolved()
            ->findOrFail($id);

        $error->markResolved($teacher->id, $validated['notes'] ?? null);

        return $this->successResponse([
            'message' => 'تم حل المشكلة بنجاح',
            'error' => $error->fresh(),
        ]);
    }

    /**
     * Get unresolved errors count
     */
    public function unresolvedCount(Request $request)
    {
        $teacher = $this->getTeacherFromRequest($request);

        $count = SyncError::forUser($teacher->id)->unresolved()->count();

        return $this->successResponse([
            'count' => $count,
        ]);
    }

    /**
     * Bulk resolve errors
     */
    public function bulkResolve(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array|max:50',
            'ids.*' => 'uuid',
            'notes' => 'nullable|string|max:1000',
        ]);

        $teacher = $this->getTeacherFromRequest($request);

        $count = SyncError::forUser($teacher->id)
            ->unresolved()
            ->whereIn('id', $validated['ids'])
            ->update([
                'resolved' => true,
                'resolved_by' => $teacher->id,
                'resolved_at' => now(),
                'resolution_notes' => $validated['notes'] ?? null,
            ]);

        return $this->successResponse([
            'message' => "تم حل {$count} مشكلة بنجاح",
            'resolved_count' => $count,
        ]);
    }
}
