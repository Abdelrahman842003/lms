<?php

namespace App\Http\Controllers\Media;

use App\Http\Controllers\Controller;
use App\Services\Media\AvatarService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AvatarController extends Controller
{
    private AvatarService $avatarService;

    public function __construct(AvatarService $avatarService)
    {
        $this->avatarService = $avatarService;
    }

    /**
     * Upload avatar
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function upload(Request $request)
    {
        try {
            // Validate request
            $request->validate([
                'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
            ]);

            // Get authenticated user
            $user = Auth::user();
            
            // Detect user type
            $userType = AvatarService::detectUserType($user);

            // Upload avatar
            $result = $this->avatarService->uploadAvatar(
                $user,
                $userType,
                $request->file('avatar')
            );

            return response()->json([
                'success' => true,
                'message' => 'Avatar uploaded successfully',
                'data' => $result,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Delete avatar
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function delete(Request $request)
    {
        try {
            // Get authenticated user
            $user = Auth::user();
            
            // Detect user type
            $userType = AvatarService::detectUserType($user);

            // Delete avatar
            $this->avatarService->deleteAvatar($user, $userType);

            return response()->json([
                'success' => true,
                'message' => 'Avatar deleted successfully',
                'data' => null, // Added data null to match typical response structure if needed, or just message
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get avatar URL
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request)
    {
        try {
            // Get authenticated user
            $user = Auth::user();
            
            // Detect user type
            $userType = AvatarService::detectUserType($user);

            // Get avatar URL
            $url = $this->avatarService->getAvatarUrl($user, $userType);

            if (!$url) {
                return response()->json([
                    'success' => false,
                    'message' => 'No avatar found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'url' => $url,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
