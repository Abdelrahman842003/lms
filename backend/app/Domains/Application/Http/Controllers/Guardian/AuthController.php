<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Guardian;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Auth\Models\Guardian;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Services\LoginAttemptService;
use App\Domains\Auth\Services\TokenService;
use App\Domains\Media\Services\ImageService;
use App\Domains\Application\Http\Requests\Guardian\Auth\GuardianLoginRequest;
use App\Domains\Application\Http\Requests\Guardian\Auth\UpdateGuardianProfileRequest;
use App\Domains\Application\Http\Requests\Guardian\Auth\ChangeGuardianPasswordRequest;
use App\Domains\Application\Services\Guardian\GuardianAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(
        private LoginAttemptService $loginAttemptService,
        private ImageService $imageService,
        private GuardianAuthService $authService,
        private TokenService $tokenService
    ) {}

    /**
     * Login with guardian phone + guardian password (separate from student)
     */
    public function login(GuardianLoginRequest $request)
    {
        // Validation handled by FormRequest

        try {
            $result = $this->authService->login(
                $request->phone, 
                $request->password, 
                $request->ip(),
                $request->userAgent() ?? 'Unknown',
                $request->boolean('remember', true)
            );

            // Format children avatars
            $children = $result['children']->map(function ($child) {
                $child['avatar'] = $child['avatar_key'] ? $this->imageService->getUrl($child['avatar_key']) : null;
                unset($child['avatar_key']);
                
                $child['teachers'] = collect($child['teachers'])->map(function ($teacher) {
                    $teacher['avatar'] = $teacher['avatar_key'] ? $this->imageService->getUrl($teacher['avatar_key']) : null;
                    unset($teacher['avatar_key']);
                    return $teacher;
                });
                
                return $child;
            });

            return $this->successResponse([
                'token' => $result['token'],
                'refresh_token' => $result['refresh_token'],
                'user' => [
                    'id' => $result['guardian']->id,
                    'name' => $result['guardian']->name,
                    'phone' => $result['guardian']->phone,
                    'avatar' => $result['guardian']->avatar_key ? $this->imageService->getUrl($result['guardian']->avatar_key) : null,
                ],
                'parent_phone' => $result['guardian']->phone,
                'children' => $children,
                'role' => 'parent',
            ]);

        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), $e->getCode() ?: 401);
        }
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        // Delete FCM token if provided
        if ($request->has('fcm_token')) {
            \App\Domains\Auth\Models\ParentDeviceToken::removeToken($request->input('fcm_token'));
        }

        // Revoke current token using TokenService
        if ($request->user()) {
            $this->tokenService->revokeCurrentToken($request->user());
        }

        return $this->successResponse(null, 'تم تسجيل الخروج بنجاح');
    }

    /**
     * Get current guardian info with children (FIXED PROFILE)
     */
    public function me(Request $request)
    {
        $guardian = $request->user();
        
        if (!$guardian) {
            return $this->errorResponse('غير مصرح', 401);
        }

        $childrenData = $this->authService->getChildrenData($guardian->students);
        
        // Format children avatars
        $children = $childrenData->map(function ($child) {
            $child['avatar'] = $child['avatar_key'] ? $this->imageService->getUrl($child['avatar_key']) : null;
            unset($child['avatar_key']);
            
            $child['teachers'] = collect($child['teachers'])->map(function ($teacher) {
                $teacher['avatar'] = $teacher['avatar_key'] ? $this->imageService->getUrl($teacher['avatar_key']) : null;
                unset($teacher['avatar_key']);
                return $teacher;
            });
            
            return $child;
        });

        return $this->successResponse([
            'user' => [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'phone' => $guardian->phone,
                'avatar' => $guardian->avatar_key ? $this->imageService->getUrl($guardian->avatar_key) : null,
            ],
            'parent_phone' => $guardian->phone,
            'children' => $children,
            'role' => 'parent',
        ]);
    }

    /**
     * Update guardian profile
     */
    public function updateProfile(UpdateGuardianProfileRequest $request)
    {
        // Validation handled by FormRequest

        $guardian = $request->user();
        $this->authService->updateProfile($guardian, $request->only(['name']));

        return $this->successResponse([
            'user' => [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'phone' => $guardian->phone,
                'avatar' => $guardian->avatar_key ? $this->imageService->getUrl($guardian->avatar_key) : null,
            ]
        ], 'تم تحديث الملف الشخصي بنجاح');
    }

    /**
     * Change guardian password (independent from students)
     */
    public function changePassword(ChangeGuardianPasswordRequest $request)
    {
        // Validation handled by FormRequest

        $guardian = $request->user();

        if (!Hash::check($request->validated('current_password'), $guardian->password)) {
            return $this->errorResponse('كلمة المرور الحالية غير صحيحة', 422);
        }

        $guardian->update(['password' => Hash::make($request->validated('new_password'))]);

        return $this->successResponse(null, 'تم تغيير كلمة المرور بنجاح');
    }

    /**
     * Get all children for the guardian
     */
    public function children(Request $request)
    {
        $guardian = $request->user();
        
        if (!$guardian) {
            return $this->errorResponse('غير مصرح', 401);
        }

        $childrenData = $this->authService->getChildrenData($guardian->students);
        
        // Format children avatars
        $children = $childrenData->map(function ($child) {
            $child['avatar'] = $child['avatar_key'] ? $this->imageService->getUrl($child['avatar_key']) : null;
            unset($child['avatar_key']);
            
            $child['teachers'] = collect($child['teachers'])->map(function ($teacher) {
                $teacher['avatar'] = $teacher['avatar_key'] ? $this->imageService->getUrl($teacher['avatar_key']) : null;
                unset($teacher['avatar_key']);
                return $teacher;
            });
            
            return $child;
        });

        return $this->successResponse([
            'children' => $children,
        ]);
    }
}
