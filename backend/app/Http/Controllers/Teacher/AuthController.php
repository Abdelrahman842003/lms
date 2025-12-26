<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\TeacherLoginRequest;
use App\Http\Resources\Teacher\TeacherResource;
use App\Services\Teacher\TeacherService;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected $teacherService;

    public function __construct(TeacherService $teacherService)
    {
        $this->teacherService = $teacherService;
    }

    public function login(TeacherLoginRequest $request)
    {
        $data = $this->teacherService->login($request->phone, $request->password);

        if (!$data) {
            return $this->errorResponse('بيانات الدخول غير صحيحة', 401);
        }
        
        // Generate Access Token (Short-lived - 30 mins by config)
        $accessToken = $data['user']->createToken('access_token', ['access-api'], now()->addMinutes(60))->plainTextToken;
        
        // Generate Refresh Token (Long-lived - 30 days)
        $refreshToken = $data['user']->createToken('refresh_token', ['issue-access-token'], now()->addDays(30))->plainTextToken;

        return $this->successResponse([
            'token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => new TeacherResource($data['user']),
            'role' => 'teacher'
        ]);
    }

    public function logout(Request $request)
    {
        // Delete FCM token if provided
        if ($request->has('fcm_token')) {
            \App\Models\DeviceToken::where('tokenable_id', $request->user()->id)
                ->where('tokenable_type', get_class($request->user()))
                ->where('token', $request->fcm_token)
                ->delete();
        }

        // Delete current token
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return $this->successResponse(null, 'تم تسجيل الخروج بنجاح');
    }

    public function me(Request $request)
    {
        return $this->successResponse([
            'user' => new TeacherResource($request->user()),
            'role' => 'teacher'
        ]);
    }

    public function changePassword(\App\Http\Requests\Auth\ChangePasswordRequest $request)
    {
        $user = $request->user();

        if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
            return $this->errorResponse('كلمة المرور الحالية غير صحيحة', 422);
        }

        $user->update([
            'password' => \Illuminate\Support\Facades\Hash::make($request->new_password)
        ]);

        return $this->successResponse(null, 'تم تغيير كلمة المرور بنجاح');
    }
}
