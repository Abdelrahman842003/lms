<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Models;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Enums\GroupType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    use HasFactory, HasUuids;

    protected static function newFactory()
    {
        return \Database\Factories\GroupFactory::new();
    }

    protected function casts(): array
    {
        return [
            'type' => GroupType::class,
        ];
    }

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

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    // Students are now linked via enrollments
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function academy(): BelongsTo
    {
        return $this->belongsTo(Academy::class);
    }

    // Note: Filtering logic moved to \App\Domains\Support\Filters\GroupFilter
}
