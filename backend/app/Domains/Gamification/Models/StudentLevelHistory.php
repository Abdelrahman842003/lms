<?php

declare(strict_types=1);

namespace App\Domains\Gamification\Models;

use App\Domains\Auth\Models\Student;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentLevelHistory extends Model
{
    use HasUuids;

    protected $table = 'student_level_history';

    protected $fillable = [
        'student_id',
        'level_id',
        'points_at_levelup',
        'certificate_path',
        'achieved_at',
    ];

    protected function casts(): array
    {
        return [
            'points_at_levelup' => 'integer',
            'achieved_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(GamificationLevel::class, 'level_id');
    }

    /**
     * Check if a certificate has been generated
     */
    public function hasCertificate(): bool
    {
        return $this->certificate_path !== null;
    }
}
