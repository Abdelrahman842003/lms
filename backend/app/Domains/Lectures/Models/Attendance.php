<?php

declare(strict_types=1);

namespace App\Domains\Lectures\Models;

use App\Domains\Auth\Models\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Attendance extends Model
{
    use HasUuids;

    protected $fillable = [
        'lecture_id',
        'student_id',
        'status',
    ];

    protected $casts = [
        'status' => \App\Domains\Lectures\Enums\StudentAttendanceStatus::class,
    ];

    public function lecture()
    {
        return $this->belongsTo(Lecture::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
