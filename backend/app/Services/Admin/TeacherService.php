<?php

namespace App\Services\Admin;

use App\Models\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TeacherService
{
    public function getTeachers(int $perPage = 10, array $filters = []): LengthAwarePaginator
    {
        return Teacher::select('id', 'name', 'username', 'created_at')
            ->withCount(['students', 'secretaries'])
            ->latest()
            ->filter($filters)
            ->paginate($perPage);
    }
}
