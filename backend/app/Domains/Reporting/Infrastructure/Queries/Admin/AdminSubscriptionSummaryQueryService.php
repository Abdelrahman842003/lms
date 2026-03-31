<?php

declare(strict_types=1);

namespace App\Domains\Reporting\Infrastructure\Queries\Admin;

use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Subscriptions\Models\Subscription;
use App\Domains\Reporting\Domain\ValueObjects\ReportFilters;
use App\Domains\Reporting\Infrastructure\Queries\SharedDateScope;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class AdminSubscriptionSummaryQueryService
{
    public function __construct(
        private readonly SharedDateScope $dateScope,
    ) {}

    public function getPaginatedSummary(ReportFilters $filters, int $page = 1, int $perPage = 15, string $sortColumn = 'created_at', string $sortDirection = 'desc'): LengthAwarePaginator
    {
        $query = Subscription::query();

        if ($filters->subscriptionStatus) {
            $query->where('status', $filters->subscriptionStatus);
        }

        if ($filters->entityType) {
            $query->where('type', $filters->entityType);
        }

        $query->tap(fn ($q) => $this->dateScope->apply($q, $filters->period));

        $allowedSortColumns = ['created_at', 'amount_paid', 'seats_count', 'status'];
        if (in_array($sortColumn, $allowedSortColumns)) {
            $query->orderBy($sortColumn, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return $query->paginate($perPage, ['*'], 'page', $page);
    }
}
