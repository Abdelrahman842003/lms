<?php

namespace App\Services\Secretary;

use App\Models\Secretary;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class SecretaryService
{
    public function login(string $username, string $password): array
    {
        $secretary = Secretary::where('username', $username)->first();

        if (! $secretary || ! Hash::check($password, $secretary->password)) {
            throw ValidationException::withMessages(['username' => ['بيانات الدخول غير صحيحة']]);
        }

        $token = $secretary->createToken('secretary_token', ['access-api'], now()->addMinutes(60))->plainTextToken;

        return [
            'token' => $token,
            'user' => $secretary->load('teacher'),
        ];
    }
}
