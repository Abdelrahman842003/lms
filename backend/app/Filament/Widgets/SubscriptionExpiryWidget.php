<?php

namespace App\Filament\Widgets;

use App\Domains\Subscriptions\Enums\SubscriptionStatus;
use App\Domains\Subscriptions\Enums\SubscriptionType;
use App\Domains\Subscriptions\Models\Subscription;
use Carbon\Carbon;
use Filament\Widgets\Widget;
use Illuminate\Support\Collection;

class SubscriptionExpiryWidget extends Widget
{
    protected static ?int $sort = 3;

    protected int|string|array $columnSpan = 1;

    protected string $view = 'filament.widgets.subscription-expiry-widget';

    public function getPendingSubscriptions(): Collection
    {
        return Subscription::query()
            ->with(['subscriber'])
            ->where('status', SubscriptionStatus::PENDING)
            ->where('month', '>=', Carbon::now()->startOfMonth())
            ->orderBy('month')
            ->limit(10)
            ->get()
            ->map(function (Subscription $subscription) {
                return [
                    'id' => $subscription->id,
                    'name' => $subscription->subscriber?->name ?? 'Unknown',
                    'type' => $subscription->type instanceof SubscriptionType
                        ? $subscription->type->value
                        : $subscription->type,
                    'month' => $subscription->month,
                    'amount_due' => $subscription->amount_due,
                    'amount_paid' => $subscription->amount_paid,
                    'status' => 'pending',
                ];
            });
    }

    public function getRecentPaidSubscriptions(): Collection
    {
        $sevenDaysAgo = Carbon::now()->subDays(7);

        return Subscription::query()
            ->with(['subscriber'])
            ->where('status', SubscriptionStatus::PAID)
            ->where('paid_at', '>=', $sevenDaysAgo)
            ->orderByDesc('paid_at')
            ->limit(10)
            ->get()
            ->map(function (Subscription $subscription) {
                return [
                    'id' => $subscription->id,
                    'name' => $subscription->subscriber?->name ?? 'Unknown',
                    'type' => $subscription->type instanceof SubscriptionType
                        ? $subscription->type->value
                        : $subscription->type,
                    'month' => $subscription->month,
                    'amount_due' => $subscription->amount_due,
                    'amount_paid' => $subscription->amount_paid,
                    'status' => 'paid',
                ];
            });
    }

    public function getPendingAcademies(): Collection
    {
        return $this->getPendingSubscriptions()
            ->filter(fn ($item) => $item['type'] === SubscriptionType::ACADEMY->value);
    }

    public function getPendingTeachers(): Collection
    {
        return $this->getPendingSubscriptions()
            ->filter(fn ($item) => $item['type'] === SubscriptionType::TEACHER->value);
    }

    public function getPaidAcademies(): Collection
    {
        return $this->getRecentPaidSubscriptions()
            ->filter(fn ($item) => $item['type'] === SubscriptionType::ACADEMY->value);
    }

    public function getPaidTeachers(): Collection
    {
        return $this->getRecentPaidSubscriptions()
            ->filter(fn ($item) => $item['type'] === SubscriptionType::TEACHER->value);
    }

    public function getStatusBadgeColor(string $status): string
    {
        return match ($status) {
            'pending' => 'warning',
            'paid' => 'success',
            default => 'gray',
        };
    }

    public function getStatusBadgeText(string $status): string
    {
        return match ($status) {
            'pending' => __('Pending Payment'),
            'paid' => __('Paid'),
            default => $status,
        };
    }

    protected function getViewData(): array
    {
        return [
            'pendingAcademies' => $this->getPendingAcademies(),
            'pendingTeachers' => $this->getPendingTeachers(),
            'paidAcademies' => $this->getPaidAcademies(),
            'paidTeachers' => $this->getPaidTeachers(),
        ];
    }
}
