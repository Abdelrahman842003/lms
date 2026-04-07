<?php

// Helper: read a setting from DB (via model) with fallback to env/default.
// Config files are loaded early, so we guard against DB not being ready yet.
if (! function_exists('_r2_setting')) {
    function _r2_setting(string $key, string $secretName, string $envFallback, mixed $default = ''): mixed
    {
        try {
            $value = \App\Domains\Application\Models\Setting::getValue($key);
            if ($value !== null && $value !== '') {
                return $value;
            }
        } catch (\Throwable) {
            // DB not ready (migration, first boot, etc.) — fall through to env
        }

        if (function_exists('docker_secret')) {
            $secretValue = docker_secret($secretName);
            if ($secretValue !== null && $secretValue !== '') {
                return $secretValue;
            }
        }

        return env($envFallback, $default);
    }
}

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        // Cloudflare R2 — S3-compatible object storage.
        // CORS for direct browser uploads (presigned PUT) must be configured
        // on the R2 bucket itself — see docs/docker/r2-cors.json.
        // Credentials are read from the DB settings table (cloudflare_r2_* keys,
        // encrypted at rest) with fallback to .env for local dev.
        'r2' => [
            'driver'                  => 's3',
            'key'                     => _r2_setting('cloudflare_r2_access_key_id',    'CLOUDFLARE_R2_ACCESS_KEY_ID', 'R2_ACCESS_KEY_ID'),
            'secret'                  => _r2_setting('cloudflare_r2_secret_access_key', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'R2_SECRET_ACCESS_KEY'),
            'region'                  => 'auto',
            'bucket'                  => _r2_setting('cloudflare_r2_bucket',    'CLOUDFLARE_R2_BUCKET', 'R2_BUCKET_NAME'),
            'endpoint'                => _r2_setting('cloudflare_r2_endpoint',   'CLOUDFLARE_R2_ENDPOINT', 'R2_ENDPOINT', 'https://' . env('R2_ACCOUNT_ID') . '.r2.cloudflarestorage.com'),
            'url'                     => _r2_setting('cloudflare_r2_public_url', 'CLOUDFLARE_R2_PUBLIC_URL', 'R2_PUBLIC_DOMAIN'),
            'use_path_style_endpoint' => false,
            'throw'                   => true,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
