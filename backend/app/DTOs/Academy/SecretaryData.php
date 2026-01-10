<?php

declare(strict_types=1);

namespace App\DTOs\Academy;

use Illuminate\Http\Request;

readonly class SecretaryData
{
    public function __construct(
        public string $name,
        public string $phone,
        public ?string $password,
        public ?array $permissions,
        public ?string $avatar_key,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->validated('name'),
            phone: $request->validated('phone'),
            password: $request->validated('password'),
            permissions: $request->validated('permissions'),
            avatar_key: $request->validated('avatar_key'),
        );
    }

    public function toArray(): array
    {
        return array_filter([
            'name' => $this->name,
            'phone' => $this->phone,
            'password' => $this->password,
            'permissions' => $this->permissions,
            'avatar_key' => $this->avatar_key,
        ], fn($value) => !is_null($value));
    }
}
