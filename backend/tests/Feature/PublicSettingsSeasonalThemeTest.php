<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domains\Application\Models\Setting;
use App\Domains\Application\Services\SeasonalThemeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicSettingsSeasonalThemeTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_settings_returns_default_seasonal_theme_when_not_configured(): void
    {
        $response = $this->getJson('/api/v1/public-settings');
        $defaultPalette = SeasonalThemeService::defaultPalette('default');

        $response->assertOk()
            ->assertJsonPath('data.seasonal_theme', 'default')
            ->assertJsonPath('data.seasonal_theme_primary', $defaultPalette['primary'])
            ->assertJsonPath('data.seasonal_theme_secondary', $defaultPalette['secondary'])
            ->assertJsonPath('data.seasonal_theme_bg_start', $defaultPalette['bg_start'])
            ->assertJsonPath('data.seasonal_theme_bg_end', $defaultPalette['bg_end'])
            ->assertJsonPath('data.seasonal_theme_enabled', '1')
            ->assertJsonPath('data.seasonal_theme_apply_primary', '1')
            ->assertJsonPath('data.seasonal_theme_apply_secondary', '1')
            ->assertJsonPath('data.seasonal_theme_apply_bg_start', '1')
            ->assertJsonPath('data.seasonal_theme_apply_bg_end', '1');
    }

    public function test_public_settings_returns_custom_palette_for_active_theme(): void
    {
        Setting::updateOrCreate(
            ['key' => 'seasonal_theme'],
            ['value' => 'ramadan', 'group' => 'general']
        );

        Setting::updateOrCreate(
            ['key' => 'seasonal_theme_palettes'],
            [
                'value' => json_encode([
                    'ramadan' => [
                        'primary' => '#123456',
                        'secondary' => '#654321',
                        'bg_start' => '#0a0a0a',
                        'bg_end' => '#121212',
                    ],
                ], JSON_UNESCAPED_UNICODE),
                'group' => 'general',
            ]
        );
        Setting::updateOrCreate(['key' => 'seasonal_theme_enabled'], ['value' => '0', 'group' => 'general']);
        Setting::updateOrCreate(['key' => 'seasonal_theme_apply_primary'], ['value' => '0', 'group' => 'general']);
        Setting::updateOrCreate(['key' => 'seasonal_theme_apply_secondary'], ['value' => '1', 'group' => 'general']);
        Setting::updateOrCreate(['key' => 'seasonal_theme_apply_bg_start'], ['value' => '1', 'group' => 'general']);
        Setting::updateOrCreate(['key' => 'seasonal_theme_apply_bg_end'], ['value' => '0', 'group' => 'general']);

        $response = $this->getJson('/api/v1/public-settings');

        $response->assertOk()
            ->assertJsonPath('data.seasonal_theme', 'ramadan')
            ->assertJsonPath('data.seasonal_theme_primary', '#123456')
            ->assertJsonPath('data.seasonal_theme_secondary', '#654321')
            ->assertJsonPath('data.seasonal_theme_bg_start', '#0a0a0a')
            ->assertJsonPath('data.seasonal_theme_bg_end', '#121212')
            ->assertJsonPath('data.seasonal_theme_enabled', '0')
            ->assertJsonPath('data.seasonal_theme_apply_primary', '0')
            ->assertJsonPath('data.seasonal_theme_apply_secondary', '1')
            ->assertJsonPath('data.seasonal_theme_apply_bg_start', '1')
            ->assertJsonPath('data.seasonal_theme_apply_bg_end', '0');
    }

    public function test_public_settings_falls_back_to_default_when_theme_is_invalid(): void
    {
        Setting::updateOrCreate(
            ['key' => 'seasonal_theme'],
            ['value' => 'invalid-theme', 'group' => 'general']
        );

        $response = $this->getJson('/api/v1/public-settings');
        $defaultPalette = SeasonalThemeService::defaultPalette('default');

        $response->assertOk()
            ->assertJsonPath('data.seasonal_theme', 'default')
            ->assertJsonPath('data.seasonal_theme_primary', $defaultPalette['primary'])
            ->assertJsonPath('data.seasonal_theme_secondary', $defaultPalette['secondary'])
            ->assertJsonPath('data.seasonal_theme_bg_start', $defaultPalette['bg_start'])
            ->assertJsonPath('data.seasonal_theme_bg_end', $defaultPalette['bg_end']);
    }
}
