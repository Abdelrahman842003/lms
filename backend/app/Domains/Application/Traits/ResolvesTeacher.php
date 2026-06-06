<?php

declare(strict_types=1);

namespace App\Domains\Application\Traits;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Secretary;
use Illuminate\Http\Request;

trait ResolvesTeacher
{
    /**
     * Resolve the active teacher profile from the request.
     * 
     * @param Request $request
     * @return \App\Domains\Auth\Models\TeacherProfile|null
     */
    protected function getProfileFromRequest(Request $request): ?\App\Domains\Auth\Models\TeacherProfile
    {
        return $request->attributes->get('active_profile') ?? (app()->bound('currentProfile') ? app('currentProfile') : null);
    }

    /**
     * Alias for getProfileFromRequest to support legacy controller resolution.
     */
    protected function getTeacherFromRequest(Request $request): ?\App\Domains\Auth\Models\TeacherProfile
    {
        return $this->getProfileFromRequest($request);
    }

    /**
     * Resolve and normalize teacher_id and teacher_profile_id inputs for FormRequests.
     */
    public static function resolveTeacherInput(Request $request): array
    {
        $mergeData = [];
        $user = auth()->user();
        $academyId = null;
        if ($user instanceof \App\Domains\Auth\Models\Academy) {
            $academyId = $user->id;
        } elseif ($user instanceof \App\Domains\Auth\Models\Secretary) {
            $academy = $user->academies()->first();
            if ($academy) {
                $academyId = $academy->id;
            }
        }

        if ($academyId) {
            if ($request->has('teacher_id') && !$request->has('teacher_profile_id')) {
                $teacherId = $request->input('teacher_id');
                if ($teacherId) {
                    $profile = \App\Domains\Auth\Models\TeacherProfile::where('academy_id', $academyId)
                        ->where(function ($q) use ($teacherId) {
                            $q->where('id', $teacherId)
                              ->orWhere('uuid', $teacherId)
                              ->orWhere('teacher_id', $teacherId);
                        })
                        ->first();
                    if ($profile) {
                        $mergeData['teacher_profile_id'] = (string) $profile->id;
                    }
                }
            } elseif ($request->has('teacher_profile_id') && !$request->has('teacher_id')) {
                $profileId = $request->input('teacher_profile_id');
                if ($profileId) {
                    $profile = \App\Domains\Auth\Models\TeacherProfile::where('id', $profileId)
                        ->orWhere('uuid', $profileId)
                        ->first();
                    if ($profile) {
                        $mergeData['teacher_id'] = $profile->teacher_id;
                    }
                }
            }
        }
        return $mergeData;
    }
}

