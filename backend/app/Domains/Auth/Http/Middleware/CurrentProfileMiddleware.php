<?php

declare(strict_types=1);

namespace App\Domains\Auth\Http\Middleware;

use App\Domains\Auth\Models\TeacherProfile;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CurrentProfileMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->has('teacher_id') && !$request->has('teacher_profile_id')) {
            $request->merge(['teacher_profile_id' => $request->input('teacher_id')]);
        }

        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        // Student or Teacher can pass the profile context via header UUID
        $profileUuid = $request->header('X-Profile') ?? $request->header('X-Teacher-Profile');
        $profile = null;

        if ($profileUuid) {
            // Find by UUID or ID
            $profile = TeacherProfile::where('uuid', $profileUuid)->orWhere('id', $profileUuid)->first();
        }

        // Fallbacks for profile resolution if UUID header is not present
        if (!$profile) {
            if ($user instanceof \App\Domains\Auth\Models\Teacher) {
                // Resolve using X-Academy-Id header
                $academyId = $request->header('X-Academy-Id');
                
                if ($academyId && $academyId !== 'independent') {
                    $profile = $user->profiles()->where('type', 'academy')->where('academy_id', $academyId)->first();
                    
                    if (!$profile) {
                        // Check if teacher is associated with this academy
                        $academy = \App\Domains\Auth\Models\Academy::find($academyId);
                        if ($academy && $user->academies()->where('academy_id', $academyId)->exists()) {
                            // Automatically create the academy profile for this teacher
                            $profile = TeacherProfile::create([
                                'teacher_id' => $user->id,
                                'academy_id' => $academyId,
                                'type' => 'academy',
                                'display_name' => $user->name . ' - ' . $academy->name,
                                'slug' => \Illuminate\Support\Str::slug($user->name) . '-' . \Illuminate\Support\Str::slug($academy->name) . '-' . substr($user->id, 0, 4),
                                'status' => 'ACTIVE'
                            ]);
                        }
                    }
                }
                
                // If no academy profile resolved, default to independent profile
                if (!$profile) {
                    $profile = $user->profiles()->where('type', 'independent')->first();
                    
                    if (!$profile) {
                        // Create independent profile if it doesn't exist
                        $profile = TeacherProfile::create([
                            'teacher_id' => $user->id,
                            'academy_id' => null,
                            'type' => 'independent',
                            'display_name' => $user->name . ' - مستقل',
                            'slug' => \Illuminate\Support\Str::slug($user->name) . '-independent-' . substr($user->id, 0, 4),
                            'status' => 'ACTIVE'
                        ]);
                    }
                }
            } elseif ($user instanceof \App\Domains\Auth\Models\Student) {
                // Resolve from request input/query/route parameters (ID or UUID)
                $profileId = $request->input('teacher_profile_id') 
                    ?? $request->query('teacher_profile_id') 
                    ?? $request->route('teacher_profile_id')
                    ?? $request->route('teacher') // for route parameters like {teacher}
                    ?? $request->input('teacher_id')
                    ?? $request->query('teacher_id');
                    
                if ($profileId) {
                    $profile = TeacherProfile::where('id', $profileId)
                        ->orWhere('uuid', $profileId)
                        ->first();
                }
            }
        }

        if ($profile) {
            // Verify status
            if ($profile->status !== 'ACTIVE') {
                return response()->json([
                    'message' => 'Workspace profile is not active.',
                    'error' => 'PROFILE_INACTIVE'
                ], 403);
            }

            // Authorization checks
            if ($user instanceof \App\Domains\Auth\Models\Teacher) {
                // Ensure profile belongs to this teacher
                if ($profile->teacher_id !== $user->id) {
                    return response()->json([
                        'message' => 'Unauthorized workspace profile.',
                        'error' => 'UNAUTHORIZED_WORKSPACE'
                    ], 403);
                }
            } elseif ($user instanceof \App\Domains\Auth\Models\Student) {
                // Ensure student is enrolled in this profile
                $isEnrolled = $user->enrollments()->where('teacher_profile_id', $profile->id)->exists();
                if (!$isEnrolled) {
                    return response()->json([
                        'message' => 'You are not enrolled in this workspace profile.',
                        'error' => 'NOT_ENROLLED_IN_WORKSPACE'
                    ], 403);
                }
            }

            // Bind the active profile as a singleton
            app()->instance('currentProfile', $profile);
            $request->attributes->set('active_profile', $profile);
        }

        return $next($request);
    }
}
