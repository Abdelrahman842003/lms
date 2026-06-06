<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Application\Models\SyncError;
use App\Domains\Auth\Models\TeacherProfile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class SyncErrorService
{
    public function listErrors(TeacherProfile $teacher, array $filters, int $perPage = 20): LengthAwarePaginator
    {
        $query = SyncError::forUser($teacher->id);

        // Filter by resolved status
        if (isset($filters['resolved'])) {
            if ($filters['resolved']) {
                $query->resolved();
            } else {
                $query->unresolved();
            }
        }

        // Filter by operation type
        if (!empty($filters['type'])) {
            $query->ofType($filters['type']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function getError(TeacherProfile $teacher, string $id): SyncError
    {
        return SyncError::forUser($teacher->id)->findOrFail($id);
    }

    public function resolveError(TeacherProfile $teacher, string $id, ?string $notes = null): SyncError
    {
        $error = SyncError::forUser($teacher->id)
            ->unresolved()
            ->findOrFail($id);

        $error->markResolved($teacher->id, $notes);

        return $error->fresh();
    }

    public function getUnresolvedCount(TeacherProfile $teacher): int
    {
        return SyncError::forUser($teacher->id)->unresolved()->count();
    }

    public function bulkResolveErrors(TeacherProfile $teacher, array $ids, ?string $notes = null): int
    {
        return SyncError::forUser($teacher->id)
            ->unresolved()
            ->whereIn('id', $ids)
            ->update([
                'resolved' => true,
                'resolved_by' => $teacher->id,
                'resolved_at' => now(),
                'resolution_notes' => $notes,
            ]);
    }
}
