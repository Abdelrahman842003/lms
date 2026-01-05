<?php

namespace App\Services\Admin;

use App\Models\Admin;
use App\Models\Teacher;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AdminService
{
    public function login(string $username, string $password): array
    {
        $admin = Admin::where('username', $username)->first();

        if (! $admin || ! Hash::check($password, $admin->password)) {
            throw ValidationException::withMessages(['username' => ['بيانات الدخول غير صحيحة']]);
        }

        // Generate Access Token (Short-lived - 60 mins)
        $accessToken = $admin->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;
        
        // Generate Refresh Token (Long-lived - 30 days)
        $refreshToken = $admin->createToken('refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'user' => $admin,
        ];
    }

    public function logout($user, ?string $fcmToken = null): void
    {
        // Delete FCM token if provided
        if ($fcmToken) {
            \App\Models\DeviceToken::where('tokenable_id', $user->id)
                ->where('tokenable_type', get_class($user))
                ->where('token', $fcmToken)
                ->delete();
        }

        // Delete current token
        if ($user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }
    }

    public function register(array $data): array
    {
        // Generate username from name as slug
        $baseUsername = \Illuminate\Support\Str::slug($data['name'], '_');
        $username = $baseUsername;
        $counter = 1;
        
        // Ensure unique username
        while (Admin::where('username', $username)->exists()) {
            $username = $baseUsername . '_' . $counter;
            $counter++;
        }

        $admin = Admin::create([
            'name' => $data['name'],
            'username' => $username,
            'password' => Hash::make($data['password']),
        ]);

        $token = $admin->createToken('admin_token', ['access-api'], now()->addMinutes(60))->plainTextToken;

        return [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $admin,
        ];
    }

    public function updateProfile(Admin $admin, array $data): Admin
    {
        $admin->update($data);
        return $admin->fresh();
    }

    public function changePassword(Admin $admin, string $currentPassword, string $newPassword): void
    {
        if (!Hash::check($currentPassword, $admin->password)) {
            throw ValidationException::withMessages(['current_password' => ['كلمة المرور الحالية غير صحيحة']]);
        }

        $admin->password = Hash::make($newPassword);
        $admin->save();
    }


}
