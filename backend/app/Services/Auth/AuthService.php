<?php

namespace App\Services\Auth;

use App\Models\Admin;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(string $username, string $password, ?string $domain = null)
    {
        $user = null;
        $tenant = null;

        if ($domain) {
            // Tenant Context (Teacher/Student)
            $tenant = Tenant::whereHas('domains', function ($query) use ($domain) {
                $query->where('domain', $domain);
            })->first();

            if (! $tenant) {
                throw ValidationException::withMessages([
                    'domain' => ['School/Teacher domain not found.'],
                ]);
            }

            tenancy()->initialize($tenant);

            $user = Teacher::where('username', $username)
                ->orWhere('email', $username)
                ->first();

            if (! $user) {
                $user = Student::where('username', $username)
                    ->orWhere('email', $username)
                    ->first();
            }
        } else {
            // Central Context (Admin)
            $user = Admin::where('username', $username)
                ->orWhere('email', $username)
                ->first();
        }

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['The provided credentials do not match our records.'],
            ]);
        }

        $tokenName = $domain ? 'tenant_token' : 'admin_token';
        $token = $user->createToken($tokenName)->plainTextToken;

        return [
            'user' => $user,
            'token' => $token,
            'tenant_id' => $tenant ? $tenant->id : null,
        ];
    }
}
