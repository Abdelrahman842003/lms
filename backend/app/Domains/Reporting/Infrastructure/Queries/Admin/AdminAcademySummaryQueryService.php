<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Admin;

use App\Domains\Auth\Models\Academy;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\SharedDateScope;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class AdminAcademySummaryQueryService
{
    public function __construct(
        private readonly SharedDateScope $dateScope,
    ) {}

    public function getPaginatedSummary(ReportFilters $filters, int $page = 1, int $perPage = 15, string $sortColumn = 'name', string $sortDirection = 'asc'): LengthAwarePaginator
    {
        $query = Academy::query()
            ->active()
            ->withCount(['teachers as teacher_count'])
            ->withCount(['students as linked_student_count' => fn ($q) => $q->wherePivot('is_active', true)]);

        if ($filters->planId) {
            $query->where('plan_type', $filters->planId);
        }

        $allowedSortColumns = ['name', 'created_at', 'linked_student_count', 'teacher_count'];
        if (in_array($sortColumn, $allowedSortColumns)) {
            $query->orderBy($sortColumn, $sortDirection);
        } else {
            $query->orderBy('name', 'asc');
        }

        return $query->paginate($perPage, ['*'], 'page', $page);
    }
}
