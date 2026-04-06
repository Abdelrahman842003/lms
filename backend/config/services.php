<?php

if (! function_exists('_cloudflare_setting')) {
    /**
     * Resolve Cloudflare setting from DB settings table first,
     * then fall back to Docker secret, then env/default.
     */
    function _cloudflare_setting(string $dbKey, string $secretName, ?string $envKey = null, mixed $default = null): mixed
    {
        try {
            $value = \App\Domains\Application\Models\Setting::getValue($dbKey);
            if ($value !== null && $value !== '') {
                return $value;
            }
        } catch (\Throwable) {
            // DB not ready during early bootstrap/migrations.
        }

        $secretValue = docker_secret($secretName);
        if ($secretValue !== null && $secretValue !== '') {
            return $secretValue;
        }

        return $envKey ? env($envKey, $default) : $default;
    }
}

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'firebase' => [
        'credentials' => docker_secret('FIREBASE_CREDENTIALS', storage_path('firebase/service-account.json')),
        'project_id' => docker_secret('FIREBASE_PROJECT_ID'),
    ],

    'cloudflare' => [
        'r2' => [
            'access_key_id' => _cloudflare_setting('cloudflare_r2_access_key_id', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'R2_ACCESS_KEY_ID'),
            'secret_access_key' => _cloudflare_setting('cloudflare_r2_secret_access_key', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'R2_SECRET_ACCESS_KEY'),
            'bucket' => _cloudflare_setting('cloudflare_r2_bucket', 'CLOUDFLARE_R2_BUCKET', 'R2_BUCKET_NAME'),
            'endpoint' => _cloudflare_setting('cloudflare_r2_endpoint', 'CLOUDFLARE_R2_ENDPOINT', 'R2_ENDPOINT', 'https://' . env('R2_ACCOUNT_ID') . '.r2.cloudflarestorage.com'),
            'public_url' => _cloudflare_setting('cloudflare_r2_public_url', 'CLOUDFLARE_R2_PUBLIC_URL', 'R2_PUBLIC_DOMAIN'),
        ],
        'kv' => [
            'account_id' => _cloudflare_setting('cloudflare_kv_account_id', 'CLOUDFLARE_KV_ACCOUNT_ID', 'CLOUDFLARE_KV_ACCOUNT_ID'),
            'namespace_id' => _cloudflare_setting('cloudflare_kv_namespace_id', 'CLOUDFLARE_KV_NAMESPACE_ID', 'CLOUDFLARE_KV_NAMESPACE_ID'),
            'api_token' => _cloudflare_setting('cloudflare_kv_api_token', 'CLOUDFLARE_KV_API_TOKEN', 'CLOUDFLARE_KV_API_TOKEN'),
        ],
    ],

];
