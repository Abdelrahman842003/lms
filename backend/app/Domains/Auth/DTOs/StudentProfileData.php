<?php

declare(strict_types=1);

namespace App\Domains\Auth\DTOs;

use Illuminate\Http\Request;

readonly class StudentProfileData
{
    public function __construct(
        public ?string $name = null,
        public ?string $phone = null,
        public ?string $parent_phone = null,
        public ?string $password = null,
        public ?string $location = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->validated('name'),
            phone: $request->validated('phone'),
            parent_phone: $request->validated('parent_phone'),
            password: $request->validated('password'),
            location: $request->validated('location'),
        );
    }

    public function toArray(): array
    {
        $data = array_filter([
            'name' => $this->name,
            'phone' => $this->phone,
            'parent_phone' => $this->parent_phone,
            'location' => $this->location,
        ], fn($value) => !is_null($value));

        if ($this->password) {
            $data['password'] = bcrypt($this->password);
        }

        return $data;
    }
}
