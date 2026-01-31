<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Teacher;

class EnsureTeacherNotSuspendedForStudent
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $teacherId = null;

        // 1. Check for 'teacher_id' in request input (query or body)
        if ($request->has('teacher_id')) {
            $teacherId = $request->input('teacher_id');
        }
        // 2. Check for 'teacher' route parameter
        else if ($request->route('teacher')) {
            $teacherParam = $request->route('teacher');
            // Route param could be an ID string or a Model instance if binding is used
            $teacherId = $teacherParam instanceof Teacher ? $teacherParam->id : $teacherParam;
        }

        if ($teacherId) {
            $teacher = Teacher::find($teacherId);
            
            if ($teacher && $teacher->status === 'suspended') {
                return response()->json([
                    'message' => "عفواً، هذا المدرس ({$teacher->name}) معلق حالياً ولا يمكن الوصول لبياناته.",
                    'error' => 'TEACHER_SUSPENDED'
                ], 403);
            }
        }

        return $next($request);
    }
}
