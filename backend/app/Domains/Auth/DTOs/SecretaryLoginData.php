<?php

declare(strict_types=1);

namespace App\Domains\Auth\DTOs;

use Illuminate\Http\Request;

readonly class SecretaryLoginData
{
    public function __construct(
        public string $phone,
        public string $password,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            phone: $request->validated('phone'),
            password: $request->validated('password'),
        );
    }

    public function toArray(): array
    {
        return [
            'phone' => $this->phone,
            'password' => $this->password,
        ];
    }
}
