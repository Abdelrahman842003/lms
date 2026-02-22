<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\Setting;
use Illuminate\Support\Collection;

class SettingsService
{
    private static array $maskedKeys = [
        'openai_api_key',
        'gemini_api_key',
    ];

    public function getAllSettings(): Collection
    {
        return Setting::all()->mapWithKeys(function ($setting) {
            $value = $setting->value;
            
            if (in_array($setting->key, self::$maskedKeys) && !empty($value)) {
                $value = '********';
            }
            
            return [$setting->key => $value];
        });
    }

    public function updateSettings(array $settingsData): void
    {
        foreach ($settingsData as $settingData) {
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
    }

    public function getPublicSettings(): Collection
    {
        $keys = [
            'siteName', 
            'siteDescription', 
            'maintenanceMode', 
            'whatsappNumber',

            'pricePerStudent',
            'academy_student_price',
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
        ];

        $settings = Setting::whereIn('key', $keys)
            ->get()
            ->pluck('value', 'key');
        
        // Map snake_case keys to camelCase for frontend compatibility
        // Also keep original keys for backward compatibility
        $mapped = $settings->toArray();
        foreach ($settings as $key => $value) {
            if (str_contains($key, '_')) {
                $camelKey = str_replace('_', '', lcfirst(ucwords($key, '_')));
                $mapped[$camelKey] = $value;
            }
        }
        
        return collect($mapped);
    }
}
