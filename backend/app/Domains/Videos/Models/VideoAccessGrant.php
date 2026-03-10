<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Models\Group;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoAccessGrant extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'video_id',
        'student_id',
        'teacher_id',
        'enrollment_id',
        'granted_group_id',
        'granted_at',
        'revoked_at',
        'revoked_reason',
        'eligibility_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'granted_at' => 'datetime',
            'revoked_at' => 'datetime',
            'eligibility_snapshot' => 'array',
        ];
    }

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function grantedGroup(): BelongsTo
    {
        return $this->belongsTo(Group::class, 'granted_group_id');
    }
}
