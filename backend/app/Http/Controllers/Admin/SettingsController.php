<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\SettingsService;
use App\Http\Requests\Admin\Settings\UpdateSettingsRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function __construct(
        private SettingsService $settingsService
    ) {}

    public function index(): JsonResponse
    {
        $settings = $this->settingsService->getAllSettings();

        return $this->successResponse($settings, 'تم استرجاع الإعدادات بنجاح');
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $this->settingsService->updateSettings($request->validated()['settings']);

        return $this->successResponse(null, 'تم تحديث الإعدادات بنجاح');
    }

    public function getPublicSettings(): JsonResponse
    {
        $mappedSettings = $this->settingsService->getPublicSettings();
        
        return $this->successResponse($mappedSettings, 'تم استرجاع الإعدادات العامة بنجاح');
    }
}
