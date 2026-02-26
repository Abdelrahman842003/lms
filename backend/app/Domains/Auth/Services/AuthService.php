<?php

declare(strict_types=1);

namespace App\Domains\Auth\Services;

use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function login(string $identifier, string $password)
    {
        $user = null;
        $userType = null;

        // Try to find Admin (by username or email)
        $user = Admin::where('username', $identifier)
            ->orWhere('email', $identifier)
            ->first();

        if ($user) {
            $userType = 'admin';
        }

        // Try to find Teacher (by phone)
        if (! $user) {
            $user = Teacher::where('phone', $identifier)->first();

            if ($user) {
                $userType = 'teacher';
            }
        }

        // Try to find Student (by phone)
        if (! $user) {
            $user = Student::where('phone', $identifier)->first();

            if ($user) {
                $userType = 'student';
            }
        }

        if (! $user || ! Hash::check($password, $user->password)) {
            return false;
        }

        $token = $user->createToken("{$userType}_token")->plainTextToken;

        return [
            'user'      => $user,
            'token'     => $token,
            'user_type' => $userType,
        ];
    }
}
