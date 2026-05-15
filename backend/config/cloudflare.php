<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cloudflare Stream Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Cloudflare Stream video hosting service.
    | Stream replaces R2 for all video storage and delivery.
    | R2 remains in use only for non-video files (attachments, avatars).
    |
    */

    'stream' => [
        // Cloudflare Account ID (visible in the dashboard URL)
        'account_id'  => env('CLOUDFLARE_STREAM_ACCOUNT_ID', env('CLOUDFLARE_R2_ACCOUNT_ID', env('CLOUDFLARE_KV_ACCOUNT_ID'))),

        // API Token with Stream:Edit permissions
        'api_token'   => env('CLOUDFLARE_STREAM_API_TOKEN', env('CLOUDFLARE_R2_API_TOKEN', env('CLOUDFLARE_KV_API_TOKEN'))),

        // RSA signing key for generating Signed URLs (PEM format)
        // Generate via: POST /accounts/{account_id}/stream/keys
        'signing_key' => env('CLOUDFLARE_STREAM_SIGNING_KEY'),

        // Key ID returned when creating the signing key
        'key_id'      => env('CLOUDFLARE_STREAM_KEY_ID'),

        // Webhook signing secret for verifying incoming webhooks
        'webhook_secret' => env('CLOUDFLARE_STREAM_WEBHOOK_SECRET'),

        // Allowed origins for video playback (comma-separated in .env)
        'allowed_origins' => array_filter(
            explode(',', env('CLOUDFLARE_STREAM_ALLOWED_ORIGINS', ''))
        ),

        // Customer subdomain for playback URLs
        // Format: customer-{subdomain}.cloudflarestream.com
        'customer_subdomain' => env('CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN'),

        // Default signed token TTL in seconds (1 hour)
        'signed_token_ttl' => (int) env('CLOUDFLARE_STREAM_SIGNED_TOKEN_TTL', 3600),

        // Maximum allowed video duration in seconds (2 hours)
        'max_duration_seconds' => (int) env('CLOUDFLARE_STREAM_MAX_DURATION', 7200),

        // Whether to require signed URLs for all videos
        'require_signed_urls' => (bool) env('CLOUDFLARE_STREAM_REQUIRE_SIGNED_URLS', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Pricing Constants (for internal cost calculations)
    |--------------------------------------------------------------------------
    */

    'pricing' => [
        // Cloudflare Stream costs (USD per 1,000 minutes)
        'storage_cost_per_1000_min' => 5.00,
        'delivery_cost_per_1000_min' => 1.00,

        // Exchange rate (EGP per USD) — configurable from admin
        'usd_to_egp' => (float) env('CLOUDFLARE_USD_TO_EGP', 50.0),

        // Markup multiplier
        'markup_multiplier' => 3.0,
    ],

];
