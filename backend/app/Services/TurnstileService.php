<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class TurnstileService
{
    protected $secretKey;

    public function __construct()
    {
        $path = storage_path('turnstile_secret.txt');
        if (file_exists($path)) {
            $this->secretKey = trim(file_get_contents($path));
        } else {
            // Fallback or log error
            $this->secretKey = config('services.turnstile.secret');
        }
    }

    public function validate($token)
    {
        if (empty($token)) {
            return false;
        }

        $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
            'secret' => $this->secretKey,
            'response' => $token,
        ]);

        $data = $response->json();

        return $data['success'] ?? false;
    }
}
