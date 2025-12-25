<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class TurnstileService
{
    protected $secretKey;

    public function __construct()
    {
        // TODO: Move this to .env (TURNSTILE_SECRET_KEY)
        $this->secretKey = '0x4AAAAAAACJEKVvmuxhQsRFA4xAEe34Wt5I';
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
