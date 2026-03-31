<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Admin;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\SharedDateScope;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class AdminTeacherSummaryQueryService
{
    public function __construct(
        private readonly SharedDateScope $dateScope,
    ) {}

    public function getPaginatedSummary(ReportFilters $filters, int $page = 1, int $perPage = 15, string $sortColumn = 'name', string $sortDirection = 'asc'): LengthAwarePaginator
    {
        $query = Teacher::query()
            ->where('status', 'active')
            ->withCount(['activeStudents as active_student_count']);

        if ($filters->planId) {
            $query->where('plan_type', $filters->planId);
        }

        $allowedSortColumns = ['name', 'created_at', 'active_student_count'];
        if (in_array($sortColumn, $allowedSortColumns)) {
            $query->orderBy($sortColumn, $sortDirection);
        } else {
            $query->orderBy('name', 'asc');
        }

        return $query->paginate($perPage, ['*'], 'page', $page);
    }
}
