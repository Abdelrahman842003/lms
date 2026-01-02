<?php

declare(strict_types=1);

namespace App\Http\Controllers\Media;

use App\Http\Controllers\Controller;
use App\Services\Media\AvatarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AvatarController extends Controller
{
    public function __construct(
        private AvatarService $avatarService
    ) {}

    public function upload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            ]);

            $user = Auth::user();
            $userType = AvatarService::detectUserType($user);

            $result = $this->avatarService->uploadAvatar(
                $user,
                $userType,
                $request->file('avatar')
            );

            return $this->successResponse($result, 'تم رفع الصورة بنجاح');

        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    public function delete(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $userType = AvatarService::detectUserType($user);

            $this->avatarService->deleteAvatar($user, $userType);

            return $this->successResponse(null, 'تم حذف الصورة بنجاح');

        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    public function show(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $userType = AvatarService::detectUserType($user);

            $url = $this->avatarService->getAvatarUrl($user, $userType);

            if (!$url) {
                return $this->errorResponse('لا توجد صورة', 404);
            }

            return $this->successResponse(['url' => $url]);

        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
