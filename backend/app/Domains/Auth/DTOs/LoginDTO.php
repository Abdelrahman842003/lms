<?php

declare(strict_types=1);

namespace App\Domains\Auth\DTOs;

use Illuminate\Http\Request;

/**
 * DTO للـ Login — يحمل بيانات تسجيل الدخول بشكل type-safe.
 */
final readonly class LoginDTO
{
    public function __construct(
        public string  $phone,
        public string  $password,
        public ?string $fcmToken     = null,
        public ?string $deviceName   = null,
        public ?string $deviceType   = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            phone:      $request->validated('phone'),
            password:   $request->validated('password'),
            fcmToken:   $request->validated('fcm_token'),
            deviceName: $request->input('device_name'),
            deviceType: $request->input('device_type'),
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            phone:      $data['phone'],
            password:   $data['password'],
            fcmToken:   $data['fcm_token'] ?? null,
            deviceName: $data['device_name'] ?? null,
            deviceType: $data['device_type'] ?? null,
        );
    }
}
