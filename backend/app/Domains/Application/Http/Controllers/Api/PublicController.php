<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Api;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Services\Admin\SettingsService;
use Illuminate\Http\JsonResponse;

class PublicController extends Controller
{
    public function __construct(
        private SettingsService $settingsService
    ) {}

    public function publicSettings(): JsonResponse
    {
        $mappedSettings = $this->settingsService->getPublicSettings();

        return $this->successResponse($mappedSettings, 'تم استرجاع الإعدادات العامة بنجاح');
    }
}
