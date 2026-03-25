<?php

declare(strict_types=1);

namespace App\Domains\Auth\Actions;

use App\Domains\Auth\DTOs\LoginDTO;
use App\Domains\Auth\Events\UserLoggedIn;
use App\Domains\Auth\Models\Admin;
use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\Secretary;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Services\DeviceLimitService;
use App\Domains\Application\Exceptions\DomainException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

/**
 * Action مسؤول عن تسجيل الدخول لجميع أنواع المستخدمين.
 * يُنشئ access token + refresh token + يتحقق من device limit.
 */
final class LoginAction
{
    public function __construct(
        private readonly DeviceLimitService $deviceLimitService
    ) {}

    /**
     * @param  class-string<Model>  $userModel  مثلاً Teacher::class
     * @param  LoginDTO  $dto
     * @return array{user: Model, access_token: string, refresh_token: string, role: string, device_removed: bool}
     * @throws DomainException
     */
    public function execute(string $userModel, LoginDTO $dto): array
    {
        /** @var Model|null $user */
        $user = $userModel::where('phone', $dto->phone)->first();

        if (! $user || ! Hash::check($dto->password, $user->password)) {
            throw new DomainException('بيانات الدخول غير صحيحة.', 0, null);
        }

        // التحقق من حالة المستخدم (suspended / pending)
        $this->ensureUserIsActive($user);

        // إدارة حد الأجهزة باستخدام DeviceLimitService
        $deviceResult = $this->deviceLimitService->checkAndManageDevices($user);

        // توليد الـ tokens
        $accessToken  = $user->createToken('access_token',  ['access-api'],        now()->addMinutes(60))->plainTextToken;
        $refreshToken = $user->createToken('refresh_token', ['issue-access-token'], now()->addDays(365))->plainTextToken;

        // حفظ FCM token لو مرسل
        if ($dto->fcmToken) {
            $this->storeFcmToken($user, $dto->fcmToken);
        }

        // إطلاق الـ event
        event(new UserLoggedIn($user, request()->ip(), request()->userAgent()));

        return [
            'user'           => $user,
            'access_token'   => $accessToken,
            'refresh_token'  => $refreshToken,
            'role'           => $this->resolveRole($userModel),
            'device_removed' => $deviceResult['removed_device'],
        ];
    }

    /**
     * التحقق من أن المستخدم مفعّل.
     */
    private function ensureUserIsActive(Model $user): void
    {
        if (method_exists($user, 'getAttribute')) {
            $status = $user->status ?? null;

            if ($status === 'suspended') {
                throw new DomainException('عفواً، تم تعليق حسابك. يرجى التواصل مع الإدارة.', 0, null);
            }

            if ($status === 'pending') {
                throw new DomainException('عفواً، حسابك في انتظار الموافقة. يرجى التواصل مع الإدارة.', 0, null);
            }
        }
    }

    /**
     * حفظ FCM token للإشعارات.
     */
    private function storeFcmToken(Model $user, string $token): void
    {
        \App\Domains\Auth\Models\DeviceToken::updateOrCreate(
            [
                'tokenable_id'   => $user->id,
                'tokenable_type' => get_class($user),
                'token'          => $token,
            ],
            ['updated_at' => now()]
        );
    }

    /**
     * تحديد الـ role من نوع الـ model.
     */
    private function resolveRole(string $userModel): string
    {
        return match ($userModel) {
            Teacher::class   => 'teacher',
            Student::class   => 'student',
            Secretary::class => 'secretary',
            Guardian::class  => 'parent',
            Admin::class     => 'admin',
            default          => 'user',
        };
    }
}
