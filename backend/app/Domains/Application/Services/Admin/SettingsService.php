<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Admin;

use App\Domains\Application\Models\Setting;
use App\Domains\Application\Services\SeasonalThemeService;
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
            'teacher_price_per_student',
            'academy_price_per_student',

            'seo_title',
            'seo_description',
            'seo_keywords',
            'seo_og_image',
            'seo_twitter_handle',
            'seo_twitter_card',
            'seo_google_verification',
            'seo_bing_verification',
            'seo_robots_txt',
            'seo_canonical_url',
            'seo_og_title',
            'seo_og_description',

            'geo_business_name',
            'geo_business_type',
            'geo_country_code',
            'geo_region',
            'geo_city',
            'geo_address',
            'geo_latitude',
            'geo_longitude',
            'geo_service_radius_km',
            'geo_place_id',
            'geo_knowledge_panel_url',
            'geo_service_areas',

            'firebase_api_key',
            'firebase_auth_domain',
            'firebase_project_id',
            'firebase_storage_bucket',
            'firebase_messaging_sender_id',
            'firebase_app_id',

            'trial_period_days',
            'seasonal_theme',
            'seasonal_theme_enabled',
            'seasonal_theme_apply_primary',
            'seasonal_theme_apply_secondary',
            'seasonal_theme_apply_bg_start',
            'seasonal_theme_apply_bg_end',
        ];

        $settings = Setting::whereIn('key', $keys)
            ->get()
            ->pluck('value', 'key');

        // Map snake_case keys to camelCase for frontend compatibility
        // Also keep original keys for backward compatibility
        $mapped = $settings->toArray();

        $activeTheme = SeasonalThemeService::normalizeTheme(
            is_string($settings->get('seasonal_theme')) ? $settings->get('seasonal_theme') : null
        );
        $resolvedPalette = SeasonalThemeService::resolvePalette(
            $activeTheme,
            Setting::getValue('seasonal_theme_palettes', null)
        );

        $mapped['seasonal_theme'] = $activeTheme;
        $mapped['seasonal_theme_primary'] = $resolvedPalette['primary'];
        $mapped['seasonal_theme_secondary'] = $resolvedPalette['secondary'];
        $mapped['seasonal_theme_bg_start'] = $resolvedPalette['bg_start'];
        $mapped['seasonal_theme_bg_end'] = $resolvedPalette['bg_end'];
        $mapped['seasonal_theme_enabled'] = (string) ($settings->get('seasonal_theme_enabled') ?? '1');
        $mapped['seasonal_theme_apply_primary'] = (string) ($settings->get('seasonal_theme_apply_primary') ?? '1');
        $mapped['seasonal_theme_apply_secondary'] = (string) ($settings->get('seasonal_theme_apply_secondary') ?? '1');
        $mapped['seasonal_theme_apply_bg_start'] = (string) ($settings->get('seasonal_theme_apply_bg_start') ?? '1');
        $mapped['seasonal_theme_apply_bg_end'] = (string) ($settings->get('seasonal_theme_apply_bg_end') ?? '1');

        foreach ($settings as $key => $value) {
            if (str_contains($key, '_')) {
                $camelKey = str_replace('_', '', lcfirst(ucwords($key, '_')));
                $mapped[$camelKey] = $value;
            }
        }

        foreach ([
            'seasonal_theme',
            'seasonal_theme_primary',
            'seasonal_theme_secondary',
            'seasonal_theme_bg_start',
            'seasonal_theme_bg_end',
            'seasonal_theme_enabled',
            'seasonal_theme_apply_primary',
            'seasonal_theme_apply_secondary',
            'seasonal_theme_apply_bg_start',
            'seasonal_theme_apply_bg_end',
        ] as $key) {
            $camelKey = str_replace('_', '', lcfirst(ucwords($key, '_')));
            $mapped[$camelKey] = $mapped[$key];
        }
        
        return collect($mapped);
    }
}
