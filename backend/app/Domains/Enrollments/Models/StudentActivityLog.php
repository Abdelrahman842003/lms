<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Models;

use App\Domains\Auth\Models\Student;
use App\Domains\Enrollments\Enums\StudentActivityAction;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentActivityLog extends Model
{
    use HasFactory, HasUuids;

    const UPDATED_AT = null; // We only use created_at

    protected $fillable = [
        'student_id',
        'enrollment_id',
        'action',
        'data',
        'performed_by_type',
        'performed_by_id',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'created_at' => 'datetime',
            'action' => StudentActivityAction::class,
        ];
    }

    // Relationships
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function enrollment()
    {
        return $this->belongsTo(Enrollment::class);
    }

    // Helper method to log activities
    public static function log(
        string $studentId, 
        string $action, 
        ?string $enrollmentId = null,
        ?array $data = null,
        ?string $performedByType = null,
        string|int|null $performedById = null
    ): self {
        return self::create([
            'student_id' => $studentId,
            'enrollment_id' => $enrollmentId,
            'action' => $action,
            'data' => $data,
            'performed_by_type' => $performedByType,
            'performed_by_id' => $performedById,
        ]);
    }
}
