<?php

namespace App\Filament\Widgets;

use App\Enums\SubscriptionStatus;
use App\Enums\SubscriptionType;
use App\Models\Subscription;
use Carbon\Carbon;
use Filament\Widgets\Widget;
use Illuminate\Support\Collection;

class SubscriptionExpiryWidget extends Widget
{
    protected static ?int $sort = 3;

    protected int|string|array $columnSpan = 1;

    protected static string $view = 'filament.widgets.subscription-expiry-widget';

    public function getExpiringSubscriptions(): Collection
    {
        $sevenDaysFromNow = Carbon::now()->addDays(7);

        return Subscription::query()
            ->with(['subscriber'])
            ->where('status', SubscriptionStatus::ACTIVE)
            ->where('end_date', '<=', $sevenDaysFromNow)
            ->where('end_date', '>=', Carbon::now())
            ->orderBy('end_date')
            ->limit(10)
            ->get()
            ->map(function (Subscription $subscription) {
                return [
                    'id' => $subscription->id,
                    'name' => $subscription->subscriber?->name ?? 'Unknown',
                    'type' => $subscription->type instanceof SubscriptionType
                        ? $subscription->type->value
                        : $subscription->type,
                    'plan' => $subscription->plan,
                    'expiry_date' => $subscription->end_date,
                    'days_remaining' => Carbon::now()->diffInDays($subscription->end_date, false),
                    'status' => 'expiring',
                ];
            });
    }

    public function getRecentlyExpiredSubscriptions(): Collection
    {
        $sevenDaysAgo = Carbon::now()->subDays(7);

        return Subscription::query()
            ->with(['subscriber'])
            ->where('status', SubscriptionStatus::EXPIRED)
            ->where('end_date', '>=', $sevenDaysAgo)
            ->orderByDesc('end_date')
            ->limit(10)
            ->get()
            ->map(function (Subscription $subscription) {
                return [
                    'id' => $subscription->id,
                    'name' => $subscription->subscriber?->name ?? 'Unknown',
                    'type' => $subscription->type instanceof SubscriptionType
                        ? $subscription->type->value
                        : $subscription->type,
                    'plan' => $subscription->plan,
                    'expiry_date' => $subscription->end_date,
                    'days_remaining' => Carbon::now()->diffInDays($subscription->end_date, false),
                    'status' => 'expired',
                ];
            });
    }

    public function getExpiringAcademies(): Collection
    {
        return $this->getExpiringSubscriptions()
            ->filter(fn ($item) => $item['type'] === SubscriptionType::ACADEMY->value);
    }

    public function getExpiringTeachers(): Collection
    {
        return $this->getExpiringSubscriptions()
            ->filter(fn ($item) => $item['type'] === SubscriptionType::TEACHER->value);
    }

    public function getExpiredAcademies(): Collection
    {
        return $this->getRecentlyExpiredSubscriptions()
            ->filter(fn ($item) => $item['type'] === SubscriptionType::ACADEMY->value);
    }

    public function getExpiredTeachers(): Collection
    {
        return $this->getRecentlyExpiredSubscriptions()
            ->filter(fn ($item) => $item['type'] === SubscriptionType::TEACHER->value);
    }

    public function getExpiryBadgeColor(int $daysRemaining): string
    {
        return match (true) {
            $daysRemaining <= 1 => 'danger',
            $daysRemaining <= 3 => 'warning',
            default => 'info',
        };
    }

    public function getExpiryBadgeText(int $daysRemaining): string
    {
        return match (true) {
            $daysRemaining === 0 => __('Today'),
            $daysRemaining === 1 => __('Tomorrow'),
            $daysRemaining < 0 => __('Expired :days days ago', ['days' => abs($daysRemaining)]),
            default => __(':days days', ['days' => $daysRemaining]),
        };
    }

    protected function getViewData(): array
    {
        return [
            'expiringAcademies' => $this->getExpiringAcademies(),
            'expiringTeachers' => $this->getExpiringTeachers(),
            'expiredAcademies' => $this->getExpiredAcademies(),
            'expiredTeachers' => $this->getExpiredTeachers(),
        ];
    }
}
