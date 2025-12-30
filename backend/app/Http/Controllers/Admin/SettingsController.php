<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->mapWithKeys(function ($setting) {
            $value = $setting->value;
            
            // If key is encrypted, mask it
            // The Model Accessor already decrypts it, so $value here is the plain text (if we wanted it)
            // But for security, we mask it before sending to frontend
            if (in_array($setting->key, Setting::$encryptedKeys) && !empty($value)) {
                $value = '********';
            }
            
            return [$setting->key => $value];
        });

        return response()->json([
            'status' => true,
            'message' => 'Settings retrieved successfully',
            'data' => $settings
        ]);
    }

    public function update(Request $request)
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

            // Handle Encrypted Keys
            if (in_array($key, Setting::$encryptedKeys)) {
                // If value is masked (********), skip updating (user didn't change it)
                if ($value === '********') {
                    continue;
                }
                // The Model Mutator will handle encryption automatically
            }

            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $value,
                    'group' => $group
                ]
            );
        }

        return response()->json([
            'status' => true,
            'message' => 'Settings updated successfully',
            'data' => null
        ]);
    }

    public function getPublicSettings()
    {
        $settings = Setting::whereIn('key', [
            'siteName', 
            'siteDescription', 
            'maintenanceMode', 
            'whatsappNumber',
            // SEO Settings
            'seo_title',
            'seo_description',
            'seo_keywords',
            'seo_og_image',
            'seo_twitter_handle',
            'seo_google_verification',
            'seo_bing_verification',
            'seo_robots_txt',
            'seo_canonical_url',
            // Public Firebase Config (Safe to expose)
            'firebase_api_key',
            'firebase_auth_domain',
            'firebase_project_id',
            'firebase_storage_bucket',
            'firebase_messaging_sender_id',
            'firebase_app_id',
        ])->get();
        
        // The Model Accessor automatically decrypts values
        $mappedSettings = $settings->pluck('value', 'key');
        
        return response()->json([
            'status' => true,
            'message' => 'Public settings retrieved successfully',
            'data' => $mappedSettings
        ]);
    }
}
