<?php

namespace App\Traits;

/**
 * Trait for applying academy-based filtering to queries.
 * Used to isolate data between academies and independent teachers.
 */
trait HasAcademyFilter
{
    /**
     * Apply academy filter to a query based on grade's academy_id
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string|null $academyId - null (no filter), 'independent', or UUID
     * @param string $gradeRelation - the name of the grade relationship
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected function applyAcademyFilter($query, ?string $academyId, string $gradeRelation = 'grade')
    {
        // If no academy selected, return empty results (require explicit selection)
        if (!$academyId) {
            return $query->whereRaw('1 = 0'); // Always false - returns empty
        }

        if ($academyId === 'independent') {
            // Independent mode: grades with NULL academy_id or no grade at all
            return $query->where(function ($q) use ($gradeRelation) {
                $q->whereDoesntHave($gradeRelation)
                  ->orWhereHas($gradeRelation, function ($g) {
                      $g->whereNull('academy_id');
                  });
            });
        }

        // Specific academy: filter by grade's academy_id
        return $query->whereHas($gradeRelation, function ($g) use ($academyId) {
            $g->where('academy_id', $academyId);
        });
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
