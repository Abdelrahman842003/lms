<?php

declare(strict_types=1);

namespace App\Domains\Notifications\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Auth\Models\Student;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SentNotification extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'teacher_id',
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

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
