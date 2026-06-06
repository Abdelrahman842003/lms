<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Models;

use App\Domains\Auth\Models\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasUuids, HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\AttendanceFactory::new();
    }

    protected $fillable = [
        'lecture_id',
        'lecture_session_id',
        'student_id',
        'status',
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

    public function session(): BelongsTo
    {
        return $this->belongsTo(LectureSession::class, 'lecture_session_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
