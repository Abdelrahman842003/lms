<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domains\Support\Models\Setting;
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
                    // Firebase
                    case 'firebase_service_account':
                        // Try to decode JSON, if fails, use as string (path?)
                        $json = json_decode($value, true);
                        Config::set('services.firebase.credentials', $json ?? $value);
                        break;
                    case 'firebase_api_key':
                        Config::set('services.firebase.api_key', $value);
                        break;
                    case 'firebase_auth_domain':
                        Config::set('services.firebase.auth_domain', $value);
                        break;
                    case 'firebase_project_id':
                        Config::set('services.firebase.project_id', $value);
                        break;
                    case 'firebase_storage_bucket':
                        Config::set('services.firebase.storage_bucket', $value);
                        break;
                    case 'firebase_messaging_sender_id':
                        Config::set('services.firebase.messaging_sender_id', $value);
                        break;
                    case 'firebase_app_id':
                        Config::set('services.firebase.app_id', $value);
                        break;

                    // Cloudflare R2
                    case 'cloudflare_r2_access_key_id':
                        Config::set('filesystems.disks.r2.key', $value);
                        Config::set('services.cloudflare.r2.access_key_id', $value);
                        break;
                    case 'cloudflare_r2_secret_access_key':
                        Config::set('filesystems.disks.r2.secret', $value);
                        Config::set('services.cloudflare.r2.secret_access_key', $value);
                        break;
                    case 'cloudflare_r2_bucket':
                        Config::set('filesystems.disks.r2.bucket', $value);
                        Config::set('services.cloudflare.r2.bucket', $value);
                        break;
                    case 'cloudflare_r2_endpoint':
                        Config::set('filesystems.disks.r2.endpoint', $value);
                        Config::set('services.cloudflare.r2.endpoint', $value);
                        break;
                    case 'cloudflare_r2_public_url':
                        Config::set('filesystems.disks.r2.url', $value);
                        Config::set('services.cloudflare.r2.public_url', $value);
                        break;

                    // Cloudflare KV
                    case 'cloudflare_kv_account_id':
                        Config::set('services.cloudflare.kv.account_id', $value);
                        break;
                    case 'cloudflare_kv_namespace_id':
                        Config::set('services.cloudflare.kv.namespace_id', $value);
                        break;
                    case 'cloudflare_kv_api_token':
                        Config::set('services.cloudflare.kv.api_token', $value);
                        break;

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
