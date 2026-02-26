<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Controllers\Api;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Lectures\Models\Lecture;
use App\Domains\Lectures\Models\LectureSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LectureSessionController extends Controller
{
    public function index(Request $request, Lecture $lecture)
    {
        $user = $request->user();
        
        // 1. If user is Teacher, must own the lecture
        if ($user instanceof \App\Domains\Auth\Models\Teacher) {
            if ($user->id !== $lecture->teacher_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }
        // 2. If user is Academy, lecture must belong to it (directly or via relations)
        elseif ($user instanceof \App\Domains\Auth\Models\Academy) {
             $isAuthorized = ($lecture->academy_id === $user->id) ||
                             ($lecture->grade && $lecture->grade->academy_id === $user->id) ||
                             ($lecture->group && $lecture->group->academy_id === $user->id);
                             
             if (!$isAuthorized) {
                 return response()->json(['message' => 'Unauthorized for Academy'], 403);
             }
        }
        // 3. Other users (e.g. Student) - currently not implemented explicitly, default deny if strict
        else {
             // If neither Teacher nor Academy, likely unauthorized for this endpoint
             return response()->json(['message' => 'Unauthorized type'], 403);
        }

        $query = $lecture->sessions();

        if ($request->has('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        return response()->json([
            'data' => $query->orderBy('date')->get()
        ]);
    }

    public function store(Request $request, Lecture $lecture)
    {
        $user = $request->user();
        
        // 1. If user is Teacher, must own the lecture
        if ($user instanceof \App\Domains\Auth\Models\Teacher) {
            if ($user->id !== $lecture->teacher_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }
        // 2. If user is Academy, lecture must belong to it (directly or via relations)
        elseif ($user instanceof \App\Domains\Auth\Models\Academy) {
             $isAuthorized = ($lecture->academy_id === $user->id) ||
                             ($lecture->grade && $lecture->grade->academy_id === $user->id) ||
                             ($lecture->group && $lecture->group->academy_id === $user->id);
                             
             if (!$isAuthorized) {
                 return response()->json(['message' => 'Unauthorized for Academy'], 403);
             }
        }
        // 3. Other users
        else {
             return response()->json(['message' => 'Unauthorized type'], 403);
        }

        $validated = $request->validate([
            'date' => 'required|date',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_cancelled' => 'boolean',
        ]);

        $session = $lecture->sessions()->updateOrCreate(
            ['date' => $validated['date']],
            $validated
        );

        return response()->json([
            'message' => 'Session updated successfully',
            'data' => $session
        ]);
    }
}
