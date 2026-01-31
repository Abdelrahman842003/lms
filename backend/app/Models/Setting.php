<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'group'];

    // List of keys that should be encrypted
    public static $encryptedKeys = [
        // Firebase
        'firebase_service_account',
        'firebase_api_key',
        'firebase_auth_domain',
        'firebase_project_id',
        'firebase_storage_bucket',
        'firebase_messaging_sender_id',
        'firebase_app_id',
        
        // Cloudflare R2
        'cloudflare_r2_access_key_id',
        'cloudflare_r2_secret_access_key',
        'cloudflare_r2_bucket',
        'cloudflare_r2_endpoint',
        'cloudflare_r2_public_url',
        
        // Cloudflare KV
        'cloudflare_kv_account_id',
        'cloudflare_kv_namespace_id',
        'cloudflare_kv_api_token',
        
        // AI
        'openai_api_key',
        'gemini_api_key',
        
        // Cloudflare Turnstile (Security)
        'turnstile_site_key',
        'turnstile_secret_key',
    ];

    public static function getValue($key, $default = null)
    {
        return \App\Services\Infrastructure\CacheService::getSetting($key, function () use ($key, $default) {
            // Use first() to trigger the Accessor
            $setting = self::where('key', $key)->first();
            return $setting ? $setting->value : $default;
        });
    }

    // Accessor: Decrypt value if needed
    public function getValueAttribute($value)
    {
        if (in_array($this->key, self::$encryptedKeys) && !empty($value)) {
            try {
                return Crypt::decryptString($value);
            } catch (\Exception $e) {
                return $value;
            }
        }
        return $value;
    }

    // Mutator: Encrypt value if needed
    public function setValueAttribute($value)
    {
        if (in_array($this->key, self::$encryptedKeys) && !empty($value)) {
            $this->attributes['value'] = Crypt::encryptString($value);
        } else {
            $this->attributes['value'] = $value;
        }
    }

    protected static function booted()
    {
        static::saved(fn($setting) => \App\Services\Infrastructure\CacheService::forgetSetting($setting->key));
        static::deleted(fn($setting) => \App\Services\Infrastructure\CacheService::forgetSetting($setting->key));
    }
}
