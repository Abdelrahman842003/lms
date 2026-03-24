<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Teacher;

use App\Domains\Application\Models\SyncError;
use App\Domains\Auth\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class SyncErrorService
{
    public function listErrors(Teacher $teacher, array $filters, int $perPage = 20): LengthAwarePaginator
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

    public function getError(Teacher $teacher, string $id): SyncError
    {
        return SyncError::forUser($teacher->id)->findOrFail($id);
    }

    public function resolveError(Teacher $teacher, string $id, ?string $notes = null): SyncError
    {
        $error = SyncError::forUser($teacher->id)
            ->unresolved()
            ->findOrFail($id);

        $error->markResolved($teacher->id, $notes);

        return $error->fresh();
    }

    public function getUnresolvedCount(Teacher $teacher): int
    {
        return SyncError::forUser($teacher->id)->unresolved()->count();
    }

    public function bulkResolveErrors(Teacher $teacher, array $ids, ?string $notes = null): int
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
