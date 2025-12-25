<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class TurnstileService
{
    protected $secretKey;

    public function __construct()
    {
        $secretPath = base_path('secrets/cloudflare_turnstile_secret_key.txt');
        
        if (file_exists($secretPath)) {
            $this->secretKey = trim(file_get_contents($secretPath));
        } else {
            // Fallback or log error
            $this->secretKey = '';
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
