<?php

namespace App\Services\Secretary;

use App\Models\Secretary;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class SecretaryService
{
    public function login(string $phone, string $password): array|false
    {
        $secretary = Secretary::where('phone', $phone)->first();

        if (! $secretary || ! Hash::check($password, $secretary->password)) {
            return false;
        }

        // Check if the secretary is linked to any active (non-suspended) teachers
        $teachers = $secretary->teachers()->get();
        
        if ($teachers->isEmpty()) {
            // No teachers linked - cannot login
            throw ValidationException::withMessages([
                'phone' => ['عذراً، لا يمكن الدخول للنظام حالياً. يرجى التواصل مع الإدارة للمساعدة.'],
            ]);
        }

        // Check if all teachers are suspended
        $allSuspended = $teachers->every(fn ($teacher) => $teacher->is_suspended);
        
        if ($allSuspended) {
            throw ValidationException::withMessages([
                'phone' => ['عذراً، لا يمكن الدخول للنظام حالياً. يرجى التواصل مع الإدارة للمساعدة.'],
            ]);
        }

        $token = $secretary->createToken('secretary_token', ['access-api'], now()->addMinutes(60))->plainTextToken;

        return [
            'token' => $token,
            'user' => $secretary->load('teachers'),
        ];
    }
}
