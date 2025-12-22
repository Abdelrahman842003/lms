<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'group'];

    public static function getValue($key, $default = null)
    {
        return \App\Services\Infrastructure\CacheService::getSetting($key, function () use ($key, $default) {
            return self::where('key', $key)->value('value') ?? $default;
        });
    }

    protected static function booted()
    {
        static::saved(fn($setting) => \App\Services\Infrastructure\CacheService::forgetSetting($setting->key));
        static::deleted(fn($setting) => \App\Services\Infrastructure\CacheService::forgetSetting($setting->key));
    }
}
