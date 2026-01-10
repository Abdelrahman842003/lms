<?php

namespace App\Services\Academy;

use App\Models\Academy;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AcademyAuthService
{
    public function login(string $phone, string $password): array|false
    {
        $academy = Academy::where('phone', $phone)->first();

        if (! $academy || ! Hash::check($password, $academy->password)) {
            return false;
        }

        if (! $academy->is_active) {
            throw ValidationException::withMessages([
                'phone' => ['عفواً، تم تعطيل حسابك. يرجى التواصل مع الإدارة.'],
            ]);
        }

        $token = $academy->createToken('academy_token', ['access-api'], now()->addMinutes(60))->plainTextToken;

        return [
            'token' => $token,
            'user' => $academy->load(['secretaries', 'teachers']),
        ];
    }
}
