<?php

declare(strict_types=1);

namespace App\DTOs\Academy;

use Illuminate\Http\Request;

readonly class TeacherData
{
    public function __construct(
        public string $name,
        public string $phone,
        public string $password,
        public ?string $subject = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            name: $request->validated('name'),
            phone: $request->validated('phone'),
            password: $request->validated('password'),
            subject: $request->validated('subject'),
        );
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'phone' => $this->phone,
            'password' => $this->password,
            'subject' => $this->subject,
        ];
    }
}
