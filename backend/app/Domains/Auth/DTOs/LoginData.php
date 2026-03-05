<?php

declare(strict_types=1);

namespace App\Domains\Auth\DTOs;

use Illuminate\Http\Request;

readonly class LoginData
{
    public function __construct(
        public string $phone,
        public string $password,
        public bool $remember,
        public ?string $fcm_token,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            phone: $request->validated('phone'),
            password: $request->validated('password'),
            remember: $request->boolean('remember', true),
            fcm_token: $request->validated('fcm_token'),
        );
    }

    public function toArray(): array
    {
        return [
            'phone' => $this->phone,
            'password' => $this->password,
            'remember' => $this->remember,
            'fcm_token' => $this->fcm_token,
        ];
    }
}
