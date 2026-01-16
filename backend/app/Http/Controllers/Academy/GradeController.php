<?php

namespace App\Http\Controllers\Academy;

use App\Http\Controllers\Controller;
use App\Http\Resources\Teacher\GradeResource;
use App\Models\Grade;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GradeController extends Controller
{
    public function index(Request $request)
    {
        $academy = Auth::user();
        $perPage = $request->input('per_page', 10);
        
        // Base query: Grades for all teachers belonging to this academy OR grades created by the academy directly
        $query = Grade::where(function($q) use ($academy) {
            // Grades linked to academy's teachers
            $q->whereHas('teacher', function ($q2) use ($academy) {
                $q2->whereHas('academies', function ($q3) use ($academy) {
                    $q3->where('academy_id', $academy->id);
                });
            })
            // OR grades linked directly to the academy
            ->orWhere('academy_id', $academy->id);
        });

        // Filter by teacher_id if provided
        if ($request->has('teacher_id') && $request->teacher_id) {
            $grades = $query->where('teacher_id', $request->teacher_id)
                ->select('id', 'name', 'price', 'teacher_id')
                ->get();
                
            return $this->successResponse([
                'data' => $grades
            ]);
        }

        // 1. Detail View: If filtering by specific grade name
        if ($request->has('name') && $request->name !== null && $request->name !== '') {
            $grades = $query->where('name', $request->name)
                ->with('teacher')
                ->withCount(['groups', 'enrollments'])
                ->latest()
                ->paginate($perPage);

            return $this->successResponse(
                GradeResource::collection($grades)->response()->getData(true)
            );
        }

        // 2. Grouped View: Group by name and aggregate stats
        // We fetch all to group in PHP as it's cleaner for aggregations across relations
        $grades = $query->withCount(['groups', 'enrollments'])->get();

        $grouped = $grades->groupBy('name')->map(function ($group, $name) {
            return [
                'name' => $name,
                'teachers_count' => $group->pluck('teacher_id')->filter()->unique()->count(),
                'groups_count' => $group->sum('groups_count'),
                'students_count' => $group->sum('enrollments_count'),
                'created_at' => $group->first()->created_at,
            ];
        })->values();

        // Manual Pagination for grouped results
        $page = $request->input('page', 1);
        $offset = ($page - 1) * $perPage;
        $items = $grouped->slice($offset, $perPage)->values();

        return $this->successResponse([
            'data' => $items,
            'meta' => [
                'current_page' => (int)$page,
                'last_page' => ceil($grouped->count() / $perPage),
                'total' => $grouped->count(),
                'per_page' => $perPage,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'teacher_id' => 'nullable|exists:teachers,id',
        ]);

        $academy = Auth::user();
        
        // If teacher_id is provided, verify it belongs to academy and is active
        if ($request->teacher_id) {
            $teacher = Teacher::where('id', $request->teacher_id)
                ->where('teachers.status', 'active')
                ->whereHas('academies', function ($q) use ($academy) {
                    $q->where('academy_id', $academy->id)
                      ->where('academy_teacher.is_active', true);
                })->firstOrFail();

            $grade = $teacher->grades()->create([
                'name' => $request->name,
                'price' => $request->price,
                'academy_id' => $academy->id, // Also link to academy for easier querying
            ]);
        } else {
            // Create a global grade for this academy
            $grade = new Grade();
            $grade->id = \Illuminate\Support\Str::uuid();
            $grade->name = $request->name;
            $grade->price = $request->price;
            $grade->teacher_id = null;
            $grade->academy_id = $academy->id; // Link to academy
            $grade->save();
        }

        return $this->successResponse([
            'grade' => new GradeResource($grade),
            'message' => 'تم إضافة الصف الدراسي بنجاح'
        ], 201);
    }

    public function update(Request $request, Grade $grade)
    {
        $academy = Auth::user();

        // Verify grade belongs to this academy (either via teacher or directly)
        $isOwnedByAcademy = false;
        
        if ($grade->academy_id === $academy->id) {
            $isOwnedByAcademy = true;
        } elseif ($grade->teacher) {
            if ($grade->teacher->academies()->where('academy_id', $academy->id)->exists()) {
                $isOwnedByAcademy = true;
            }
        }

        if (!$isOwnedByAcademy) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
        ]);

        $grade->update([
            'name' => $request->name,
            'price' => $request->price,
        ]);

        return $this->successResponse([
            'grade' => new GradeResource($grade),
            'message' => 'تم تحديث الصف الدراسي بنجاح'
        ]);
    }

    public function destroy(Grade $grade)
    {
        $academy = Auth::user();

        // Verify grade belongs to this academy
        $isOwnedByAcademy = false;
        
        if ($grade->academy_id === $academy->id) {
            $isOwnedByAcademy = true;
        } elseif ($grade->teacher) {
            if ($grade->teacher->academies()->where('academy_id', $academy->id)->exists()) {
                $isOwnedByAcademy = true;
            }
        }

        if (!$isOwnedByAcademy) {
            return $this->errorResponse('Unauthorized', 403);
        }
        
        $grade->delete();

        return $this->successResponse([
            'message' => 'تم حذف الصف الدراسي بنجاح'
        ]);
    }
    public function bulkUpdateName(Request $request)
    {
        $request->validate([
            'old_name' => 'required|string',
            'new_name' => 'required|string|max:255',
        ]);

        $academy = Auth::user();

        // Update all grades with old_name belonging to ACTIVE teachers in this academy
        $count = Grade::where('name', $request->old_name)
            ->whereHas('teacher', function ($q) use ($academy) {
                $q->where('teachers.status', 'active')
                  ->whereHas('academies', function ($q2) use ($academy) {
                      $q2->where('academy_id', $academy->id)
                         ->where('academy_teacher.is_active', true);
                  });
            })
            ->update(['name' => $request->new_name]);

        return $this->successResponse([
            'message' => "تم تحديث اسم الصف لـ {$count} سجلات بنجاح"
        ]);
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
        ]);

        $academy = Auth::user();

        // Delete all grades with name belonging to ACTIVE teachers in this academy
        $count = Grade::where('name', $request->name)
            ->whereHas('teacher', function ($q) use ($academy) {
                $q->where('teachers.status', 'active')
                  ->whereHas('academies', function ($q2) use ($academy) {
                      $q2->where('academy_id', $academy->id)
                         ->where('academy_teacher.is_active', true);
                  });
            })
            ->delete();

        return $this->successResponse([
            'message' => "تم حذف {$count} سجلات للصف بنجاح"
        ]);
    }
}
