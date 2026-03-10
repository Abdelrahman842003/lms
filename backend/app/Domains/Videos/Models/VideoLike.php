<?php

declare(strict_types=1);

namespace App\Domains\Videos\Models;

use App\Domains\Auth\Models\Student;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoLike extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'video_id',
        'student_id',
    ];

    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
