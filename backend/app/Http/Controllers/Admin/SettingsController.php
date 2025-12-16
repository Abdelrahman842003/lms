<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');
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

        foreach ($data['settings'] as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'group' => $setting['group'] ?? 'general'
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
        $settings = Setting::whereIn('key', ['siteName', 'siteDescription', 'maintenanceMode'])
            ->pluck('value', 'key');
        
        return response()->json([
            'status' => true,
            'message' => 'Public settings retrieved successfully',
            'data' => $settings
        ]);
    }
}
