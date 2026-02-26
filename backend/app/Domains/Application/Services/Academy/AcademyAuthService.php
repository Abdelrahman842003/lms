<?php

declare(strict_types=1);

namespace App\Domains\Application\Services\Academy;

use App\Domains\Auth\DTOs\LoginData;
use App\Domains\Auth\Models\Academy;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AcademyAuthService
{
    public function login(LoginData $data): array|false
    {
        $academy = Academy::where('phone', $data->phone)->first();

        if (! $academy || ! Hash::check($data->password, $academy->password)) {
            return false;
        }

        if (! $academy->is_active) {
            throw ValidationException::withMessages([
                'phone' => ['عفواً، تم تعطيل حسابك. يرجى التواصل مع الإدارة.'],
            ]);
        }

        return [
            'user' => $academy->load(['secretaries', 'teachers']),
        ];
    }
}
