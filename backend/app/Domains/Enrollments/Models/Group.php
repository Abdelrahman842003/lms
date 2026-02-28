<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Models;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Enums\GroupType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Group extends Model
{
    use HasFactory, HasUuids;

    protected static function newFactory()
    {
        return \Database\Factories\GroupFactory::new();
    }

    protected $casts = [
        'type' => GroupType::class,
    ];

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'grade_id',
        'teacher_id',
        'academy_id',
        'time',
        'days',
        'type',
        'price',
    ];

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    // Students are now linked via enrollments
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function academy()
    {
        return $this->belongsTo(Academy::class);
    }

    public function scopeFilter($query, array $filters)
    {
        if ($search = $filters['search'] ?? null) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($gradeId = $filters['grade_id'] ?? null) {
            $query->where('grade_id', $gradeId);
        }
    }
}
