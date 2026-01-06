<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lecture;
use App\Models\LectureSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LectureSessionController extends Controller
{
    public function index(Request $request, Lecture $lecture)
    {
        if ($request->user()->id !== $lecture->teacher_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
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
        if ($request->user()->id !== $lecture->teacher_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
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
