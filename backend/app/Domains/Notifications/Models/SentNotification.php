<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Student;
use App\Domains\Support\Traits\UsesTeacherProfileScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SentNotification extends Model
{
    use HasFactory, HasUuids, UsesTeacherProfileScope;

    protected $fillable = [
        'teacher_profile_id',
        'admin_id',
        'student_id',
        'title',
        'message',
        'recipient_type',
        'recipient_count',
        'is_voice',
        'voice_path',
        'voice_duration',
    ];

    protected function casts(): array
    {
        return [
            'is_voice' => 'boolean',
            'voice_duration' => 'integer',
        ];
    }

    // The teacherProfile relation is provided by the UsesTeacherProfileScope trait.

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
