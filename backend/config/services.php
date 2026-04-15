<?php

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
        'credentials' => env('FIREBASE_CREDENTIALS'),
        'project_id' => env('FIREBASE_PROJECT_ID'),
    ],

    'cloudflare' => [
        'r2' => [
            'access_key_id' => env('CLOUDFLARE_R2_ACCESS_KEY_ID'),
            'secret_access_key' => env('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
            'bucket' => env('CLOUDFLARE_R2_BUCKET'),
            'endpoint' => env('CLOUDFLARE_R2_ENDPOINT'),
            'public_url' => env('CLOUDFLARE_R2_PUBLIC_URL'),
        ],
        'kv' => [
            'account_id' => env('CLOUDFLARE_KV_ACCOUNT_ID'),
            'namespace_id' => env('CLOUDFLARE_KV_NAMESPACE_ID'),
            'api_token' => env('CLOUDFLARE_KV_API_TOKEN'),
        ],
    ],

];
