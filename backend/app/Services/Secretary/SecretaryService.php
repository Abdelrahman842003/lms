<?php

declare(strict_types=1);

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

        // Check if the secretary is linked to any active (non-suspended) teachers OR active academies
        $teachers = $secretary->teachers()->get();
        $academies = $secretary->academies()->where('academies.is_active', true)->get();
        
        // Secretary can login if:
        // 1. Linked to at least one active academy, OR
        // 2. Linked to at least one teacher (and not all teachers are suspended)
        
        if ($academies->isNotEmpty()) {
            // Secretary is linked to active academy - allow login
            $token = $secretary->createToken('secretary_token', ['access-api'], now()->addMinutes(60))->plainTextToken;

            return [
                'token' => $token,
                'user' => $secretary->load(['teachers', 'academies']),
            ];
        }
        
        if ($teachers->isEmpty()) {
            // No teachers and no academies linked - cannot login
            throw ValidationException::withMessages([
                'phone' => ['عذراً، لا يمكن الدخول للنظام حالياً. يرجى التواصل مع الإدارة للمساعدة.'],
            ]);
        }

        // Check if all teachers are suspended
        $allSuspended = $teachers->every(fn ($teacher) => $teacher->status === 'suspended');
        
        if ($allSuspended) {
            throw ValidationException::withMessages([
                'phone' => ['عذراً، لا يمكن الدخول للنظام حالياً. يرجى التواصل مع الإدارة للمساعدة.'],
            ]);
        }

        $token = $secretary->createToken('secretary_token', ['access-api'], now()->addMinutes(60))->plainTextToken;

        return [
            'token' => $token,
            'user' => $secretary->load(['teachers', 'academies']),
        ];
    }
}
