<?php

declare(strict_types=1);

namespace App\Domains\Application\Traits;

/**
 * Trait for applying academy-based filtering to queries.
 * Used to isolate data between academies and independent teachers.
 */
trait HasAcademyFilter
{
    /**
     * Apply academy filter directly on academy_id column (for Enrollment queries)
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string|null $academyId - null (no filter), 'independent', or UUID
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected function applyAcademyFilter($query, ?string $academyId, string $gradeRelation = 'grade')
    {
        // If no academy selected, return empty results (require explicit selection)
        if (!$academyId) {
            return $query->whereRaw('1 = 0');
        }

        if ($academyId === 'independent') {
            // Independent mode: academy_id is NULL
            return $query->whereNull('academy_id');
        }

        // Specific academy: filter by academy_id
        return $query->where('academy_id', $academyId);
    }

    /**
     * Apply academy filter directly on a model that has academy_id column
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string|null $academyId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected function applyDirectAcademyFilter($query, ?string $academyId)
    {
        // If no academy selected, return empty results (require explicit selection)
        if (!$academyId) {
            return $query->whereRaw('1 = 0'); // Always false - returns empty
        }

        if ($academyId === 'independent') {
            return $query->whereNull('academy_id');
        }

        return $query->where('academy_id', $academyId);
    }
}
