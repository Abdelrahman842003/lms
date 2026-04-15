<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domains\Application\Models\Setting;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Config;

class SettingsServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        try {
            // Prevent issues during migration or if table doesn't exist
            if (!Schema::hasTable('settings')) {
                return;
            }
        } catch (\Exception $e) {
            return;
        }

        try {
            // Fetch all encrypted keys we care about
            // We use the model to get them so they are automatically decrypted
            $keys = Setting::$encryptedKeys;
            
            $settings = Setting::whereIn('key', $keys)->get();

            foreach ($settings as $setting) {
                $value = $setting->value; // This triggers the Accessor (decrypts)

                if (empty($value)) {
                    continue;
                }

                switch ($setting->key) {
                    // AI
                    case 'openai_api_key':
                        Config::set('services.openai.api_key', $value);
                        break;
                    case 'gemini_api_key':
                        Config::set('services.gemini.api_key', $value);
                        break;

                    // Cloudflare Turnstile (Security)
                    case 'turnstile_site_key':
                        Config::set('services.cloudflare.turnstile.site_key', $value);
                        break;
                    case 'turnstile_secret_key':
                        Config::set('services.cloudflare.turnstile.secret_key', $value);
                        break;
                }
            }
        } catch (\Exception $e) {
            // Log error or fail silently to avoid breaking the app if DB is down
            // \Log::error('Failed to load settings from DB: ' . $e->getMessage());
        }
    }
}
