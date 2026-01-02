<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    private static array $maskedKeys = [
        'openai_api_key',
        'gemini_api_key',
    ];

    public function index(): JsonResponse
    {
        $settings = Setting::all()->mapWithKeys(function ($setting) {
            $value = $setting->value;
            
            if (in_array($setting->key, self::$maskedKeys) && !empty($value)) {
                $value = '********';
            }
            
            return [$setting->key => $value];
        });

        return $this->successResponse($settings, 'تم استرجاع الإعدادات بنجاح');
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable',
            'settings.*.group' => 'nullable|string',
        ]);

        foreach ($data['settings'] as $settingData) {
            $key = $settingData['key'];
            $value = $settingData['value'];
            $group = $settingData['group'] ?? 'general';

            if (in_array($key, Setting::$encryptedKeys)) {
                if ($value === '********') {
                    continue;
                }
            }

            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $value,
                    'group' => $group
                ]
            );
        }

        return $this->successResponse(null, 'تم تحديث الإعدادات بنجاح');
    }

    public function getPublicSettings(): JsonResponse
    {
        $settings = Setting::whereIn('key', [
            'siteName', 
            'siteDescription', 
            'maintenanceMode', 
            'whatsappNumber',
            'seo_title',
            'seo_description',
            'seo_keywords',
            'seo_og_image',
            'seo_twitter_handle',
            'seo_google_verification',
            'seo_bing_verification',
            'seo_robots_txt',
            'seo_canonical_url',
            'firebase_api_key',
            'firebase_auth_domain',
            'firebase_project_id',
            'firebase_storage_bucket',
            'firebase_messaging_sender_id',
            'firebase_app_id',
        ])->get();
        
        $mappedSettings = $settings->pluck('value', 'key');
        
        return $this->successResponse($mappedSettings, 'تم استرجاع الإعدادات العامة بنجاح');
    }
}
