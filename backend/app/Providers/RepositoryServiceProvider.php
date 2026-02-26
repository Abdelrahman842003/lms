<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domains\Enrollments\Repositories\Contracts\EnrollmentRepository;
use App\Domains\Enrollments\Repositories\Eloquent\EloquentEnrollmentRepository;
use App\Domains\Enrollments\Repositories\Contracts\GroupRepository;
use App\Domains\Enrollments\Repositories\Eloquent\EloquentGroupRepository;
use App\Domains\Media\Adapters\CloudflareR2Adapter;
use App\Domains\Media\Adapters\LocalAdapter;
use App\Domains\Media\Adapters\StorageAdapter;
use Illuminate\Support\ServiceProvider;

/**
 * يربط Repository Contracts بالـ Eloquent implementations.
 * يُضاف binding جديد هنا مع كل Domain جديد.
 */
class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Enrollments
        $this->app->bind(EnrollmentRepository::class, EloquentEnrollmentRepository::class);

        // Groups
        $this->app->bind(GroupRepository::class, EloquentGroupRepository::class);

        // Storage Adapter: يستخدم Cloudflare R2 في Production، Local في غيره
        $this->app->bind(StorageAdapter::class, function () {
            return config('filesystems.disks.r2.key')
                ? new CloudflareR2Adapter()
                : new LocalAdapter();
        });
    }

    public function boot(): void
    {
        //
    }
}
