<?php

if (!function_exists('docker_secret')) {
    /**
     * Get a Docker Secret or fallback to environment variable.
     *
     * @param string $key The name of the secret (e.g., 'DB_PASSWORD')
     * @param mixed $default Default value if neither secret nor env var exists
     * @return mixed
     */
    function docker_secret(string $key, $default = null)
    {
        // 1. Check for the specific file path env var (e.g. DB_PASSWORD_FILE)
        $fileEnv = getenv($key . '_FILE');
        if ($fileEnv && file_exists($fileEnv)) {
            return trim(file_get_contents($fileEnv));
        }

        // 2. Check standard Docker secret location /run/secrets/<key>
        $standardPath = '/run/secrets/' . strtolower($key);
        if (file_exists($standardPath)) {
            return trim(file_get_contents($standardPath));
        }

        // 3. Fallback to standard environment variable
        return env($key, $default);
    }
}
