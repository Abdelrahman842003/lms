<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Models;

use App\Domains\Auth\Models\Student;
use App\Domains\Support\Traits\GuardsSensitiveFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use GuardsSensitiveFields;
    use HasUuids;

    protected $fillable = [
        'lecture_id',
        'student_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => \App\Domains\Lectures\Enums\StudentAttendanceStatus::class,
        ];
    }

    public function lecture(): BelongsTo
    {
        return $this->belongsTo(Lecture::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
