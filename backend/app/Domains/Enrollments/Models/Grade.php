<?php

declare(strict_types=1);

namespace App\Domains\Enrollments\Models;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Support\Traits\UsesTeacherProfileScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    use HasFactory, HasUuids, UsesTeacherProfileScope;

    protected static function newFactory()
    {
        return \Database\Factories\GradeFactory::new();
    }

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'price',
        'teacher_profile_id',
        'academy_id',
    ];

    // The teacherProfile relation is provided by the UsesTeacherProfileScope trait.

    public function groups()
    {
        return $this->hasMany(Group::class);
    }

    // Students are now linked via enrollments
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    // Note: Filtering logic moved to \App\Domains\Application\Filters\GradeFilter
}
